"""Read and import examination-bank entities."""

import hashlib
import json
import re
from pathlib import Path

from django.db import transaction
from django.utils.text import slugify

from .models import (
    ContentAsset,
    Exam,
    ExamPart,
    Passage,
    PassageAsset,
    Question,
    QuestionAsset,
    QuestionOption,
)


PART_TITLES = {
    1: "Mô tả hình ảnh",
    2: "Hỏi – đáp",
    3: "Đoạn hội thoại",
    4: "Bài nói ngắn",
    5: "Hoàn thành câu",
    6: "Hoàn thành đoạn văn",
    7: "Đọc hiểu",
}


def exam_title(payload, fallback):
    """Choose the most common question stem as a title when available."""
    stem_counts = {}
    for question in payload.get("questions", []):
        stem = re.split(
            r"\.\s*Part\s+[1-7]",
            question.get("question", ""),
            maxsplit=1,
        )[0].strip(" .")
        part_titles = {f"part {number}" for number in range(1, 8)}
        if stem and stem.lower() not in part_titles:
            stem_counts[stem] = stem_counts.get(stem, 0) + 1

    if stem_counts:
        return max(stem_counts, key=stem_counts.get)

    payload_title = payload.get("title", "")
    if payload_title.lower() != "part 1":
        return payload_title
    return f"TOEIC Test {fallback}"


def exam_year(payload):
    """Return the publication year inferred from the source metadata.

    Most source URLs contain an explicit year. Hacker 2/3 files do not, but
    belong to the 2025 source collection used by this application.
    """
    source_text = " ".join(
        str(payload.get(key, "")) for key in ("title", "source_url")
    )
    year_match = re.search(r"(?<!\d)(20\d{2})(?!\d)", source_text)
    if year_match:
        return int(year_match.group(1))

    source_text = source_text.lower()
    if "test-dau-vao" in source_text:
        return 2023
    if "hacker-2" in source_text or "hacker-3" in source_text:
        return 2025
    return None


def exam_slug(payload, external_id, year=None):
    """Create a stable, readable, and unique URL slug for an exam."""
    title = (
        payload.get("normalized_title")
        or payload.get("title")
        or f"TOEIC Test {external_id}"
    )
    base_slug = slugify(f"{title}-{year or external_id}")
    return (base_slug or f"exam-{external_id}")[:180]


@transaction.atomic
def import_exam_file(path):
    """Idempotently import one test JSON while preserving source payloads."""
    source_path = Path(path)
    data = json.loads(source_path.read_text(encoding="utf-8"))
    external_id = str(data.get("id", source_path.parent.name))
    questions = data.get("questions", [])
    answer_count = sum(bool(item.get("correct_answer")) for item in questions)

    year = exam_year(data)
    title = exam_title(data, external_id)
    slug_payload = {**data, "normalized_title": title}
    exam_defaults = {
        "title": title,
        "source_url": data.get("source_url", ""),
        "year": year,
        "slug": exam_slug(slug_payload, external_id, year),
        "time_limit_seconds": data.get("time_limit_seconds") or 7200,
        "question_count": len(questions),
        "answer_count": answer_count,
        "source_payload": {
            key: value
            for key, value in data.items()
            if key != "questions"
        },
    }
    exam, _ = Exam.objects.update_or_create(
        external_id=external_id,
        defaults=exam_defaults,
    )

    parts_by_number = {}
    for question_data in questions:
        part_number = int(question_data.get("part_number") or 1)
        exam_part = parts_by_number.get(part_number)
        if exam_part is None:
            question_count = sum(
                int(item.get("part_number") or 1) == part_number
                for item in questions
            )
            exam_part, _ = ExamPart.objects.update_or_create(
                exam=exam,
                part_number=part_number,
                defaults={
                    "title": PART_TITLES.get(
                        part_number,
                        f"Part {part_number}",
                    ),
                    "question_count": question_count,
                },
            )
            parts_by_number[part_number] = exam_part

        passage = None
        if part_number in (6, 7):
            content_html = question_data.get("content_html") or ""
            transcript = question_data.get("transcript") or ""
            passage_source = content_html + "|" + transcript
            if content_html or transcript:
                source_key = hashlib.sha1(
                    passage_source.encode()
                ).hexdigest()[:32]
            else:
                source_key = f"question-{question_data.get('number')}"

            passage, _ = Passage.objects.get_or_create(
                exam_part=exam_part,
                source_key=source_key,
                defaults={
                    "content_html": content_html,
                    "transcript": question_data.get("transcript", ""),
                    "sort_order": int(question_data.get("number") or 0),
                    "assets": question_data.get("image_files", []),
                },
            )

        explanation = question_data.get("explanation") or {}
        if isinstance(explanation, dict):
            explanation_reason = explanation.get("reason", "")
            explanation_tip = explanation.get("tip") or ""
        else:
            explanation_reason = str(explanation)
            explanation_tip = ""

        question_defaults = {
            "passage": passage,
            "external_question_id": str(
                question_data.get("question_id") or ""
            ),
            "title": question_data.get("title", ""),
            "prompt": question_data.get("question", "") or "",
            "prompt_html": question_data.get("content_html", ""),
            "correct_option": question_data.get("correct_answer") or None,
            "explanation_reason": explanation_reason,
            "explanation_tip": explanation_tip,
            "transcript": question_data.get("transcript", ""),
            "transcript_source": question_data.get("transcript_source", ""),
            "media": {
                "audio": question_data.get("audio_files", []),
                "images": question_data.get("image_files", []),
                "audio_url": question_data.get("audio_url", ""),
                "image_urls": question_data.get("image_urls", []),
            },
            "source_payload": question_data,
        }
        question, _ = Question.objects.update_or_create(
            exam_part=exam_part,
            number=int(question_data.get("number") or 1),
            defaults=question_defaults,
        )

        QuestionOption.objects.filter(question=question).delete()
        option_rows = [
            QuestionOption(
                question=question,
                option_key=str(key).strip(".").upper()[:1],
                answer_text=str(value),
            )
            for key, value in (question_data.get("options") or {}).items()
            if str(key).strip(".").upper()[:1] in "ABCD"
        ]
        QuestionOption.objects.bulk_create(option_rows)

        QuestionAsset.objects.filter(question=question).delete()
        for role, source_key in (("audio", "audio_files"), ("image", "image_files")):
            for sort_order, relative_path in enumerate(
                question_data.get(source_key, [])
            ):
                storage_path = f"zenlish_data/{relative_path}"
                asset, _ = ContentAsset.objects.update_or_create(
                    asset_type=role,
                    storage_path=storage_path,
                    defaults={
                        "source_url": "",
                        "metadata": {
                            "external_id": question_data.get("question_id")
                        },
                    },
                )
                QuestionAsset.objects.get_or_create(
                    question=question,
                    asset=asset,
                    role=role,
                    defaults={"sort_order": sort_order},
                )
                if passage:
                    PassageAsset.objects.get_or_create(
                        passage=passage,
                        asset=asset,
                        role=role,
                        defaults={"sort_order": sort_order},
                    )

    return exam
