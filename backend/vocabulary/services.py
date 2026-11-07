"""Import and query the locally stored topic vocabulary."""

import json
from pathlib import Path

from django.db import transaction

from .models import TermAsset, TopicTerm, VocabularyTerm, VocabularyTopic


def _asset_path(raw, slug):
    if not raw:
        return ""

    name = Path(raw).name
    folder = "topic_images" if "image" in raw else "topic_audio"
    return f"vocab/{folder}/{slug}/{name}"


@transaction.atomic
def import_topic_file(path):
    """Import one vocabulary topic and its media references."""
    source_path = Path(path)
    data = json.loads(source_path.read_text(encoding="utf-8"))
    slug = source_path.stem
    topic_name = data.get("topic", slug.replace("-", " ").title())

    topic, _ = VocabularyTopic.objects.update_or_create(
        slug=slug,
        defaults={
            "name": topic_name,
            "source_url": data.get("source_url", ""),
            "sort_order": 0,
            "is_published": True,
        },
    )

    asset_sources = (
        ("image", "image"),
        ("word_audio", "audio_word"),
        ("example_audio", "audio_example"),
    )
    for position, item in enumerate(data.get("words", [])):
        term, _ = VocabularyTerm.objects.get_or_create(
            word=item.get("word", "").strip(),
            level=item.get("level", ""),
            part_of_speech=item.get("part_of_speech", ""),
            pronunciation=item.get("pronunciation", ""),
            meaning_vi=item.get("meaning_vi", ""),
            example_en=item.get("example_en", ""),
        )
        TopicTerm.objects.update_or_create(
            topic=topic,
            term=term,
            defaults={"sort_order": position},
        )

        for asset_role, source_key in asset_sources:
            storage_path = _asset_path(item.get(source_key, ""), slug)
            if not storage_path:
                continue

            TermAsset.objects.update_or_create(
                term=term,
                asset_role=asset_role,
                defaults={"storage_path": storage_path, "source_url": ""},
            )

    return topic
