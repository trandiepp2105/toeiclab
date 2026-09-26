"""Vocabulary progress and quiz construction workflows."""
from datetime import timedelta
import random
from django.db import transaction
from django.utils import timezone
from django.db.models.functions import TruncDate
from assessments.models import TestAnswer
from vocabulary.models import VocabularyTerm, VocabularyTopic
from .models import VocabularyProgress, VocabularyQuizAttempt, VocabularyQuizAnswer


def calculate_study_streak(*, user, today=None):
    """Return the current consecutive-day streak from persisted study activity.

    Activity is a saved test answer, a saved vocabulary-quiz answer, or a
    vocabulary progress review/learned update. The streak remains active when
    the latest activity was today or yesterday.
    """
    today = today or timezone.localdate()
    local_timezone = timezone.get_current_timezone()
    activity_dates = set()

    activity_sources = (
        TestAnswer.objects.filter(
            attempt__user=user,
            answered_at__isnull=False,
        ).annotate(study_date=TruncDate("answered_at", tzinfo=local_timezone)),
        VocabularyQuizAnswer.objects.filter(
            attempt__user=user,
            answered_at__isnull=False,
        ).annotate(study_date=TruncDate("answered_at", tzinfo=local_timezone)),
        VocabularyProgress.objects.filter(
            user=user,
            last_seen_at__isnull=False,
        ).annotate(study_date=TruncDate("last_seen_at", tzinfo=local_timezone)),
        VocabularyProgress.objects.filter(
            user=user,
            learned_at__isnull=False,
        ).annotate(study_date=TruncDate("learned_at", tzinfo=local_timezone)),
    )

    for activities in activity_sources:
        activity_dates.update(activities.values_list("study_date", flat=True))

    activity_dates.discard(None)
    if not activity_dates:
        return {"current_streak": 0, "last_study_date": None}

    last_study_date = max(activity_dates)
    streak_end_date = today if last_study_date >= today else last_study_date
    if streak_end_date < today - timedelta(days=1):
        return {"current_streak": 0, "last_study_date": last_study_date}

    streak_days = 0
    study_date = streak_end_date
    while study_date in activity_dates:
        streak_days += 1
        study_date -= timedelta(days=1)

    return {
        "current_streak": streak_days,
        "last_study_date": last_study_date,
    }

@transaction.atomic
def create_quiz(*, user, scope='all', topic_id=None, question_count=10, question_types=None):
    """Build randomized bilingual questions; audio is never a quiz mode."""
    if question_count not in (10,20,30): raise ValueError('Số câu chỉ có thể là 10, 20 hoặc 30.')
    question_types=question_types or ['vi_to_en','en_to_vi']
    if not question_types or any(t not in ('vi_to_en','en_to_vi') for t in question_types): raise ValueError('Loại câu hỏi không hợp lệ.')
    terms=VocabularyTerm.objects.filter(is_active=True)
    if scope=='topic': terms=terms.filter(topic_terms__topic_id=topic_id).distinct()
    elif scope=='review': terms=terms.filter(progress_records__user=user).exclude(progress_records__status='learned')
    terms=list(terms); random.shuffle(terms); terms=terms[:min(question_count,len(terms))]
    if not terms: raise ValueError('Không có từ phù hợp với lựa chọn này.')
    attempt=VocabularyQuizAttempt.objects.create(user=user,scope=scope,topic_id=topic_id if scope=='topic' else None,question_type='mixed',question_count=len(terms))
    all_terms=list(VocabularyTerm.objects.filter(is_active=True).values_list('word','meaning_vi')); rows=[]
    for i,term in enumerate(terms,1):
        typ=random.choice(question_types); correct=term.word if typ=='vi_to_en' else term.meaning_vi
        distractors=[x[0 if typ=='vi_to_en' else 1] for x in all_terms if x[0]!=term.word and x[1]!=term.meaning_vi]
        options=random.sample(distractors,min(3,len(distractors)))+[correct]; random.shuffle(options)
        rows.append(VocabularyQuizAnswer(attempt=attempt,term=term,prompt_type=typ,options_json=options,correct_value=correct,position=i))
        VocabularyProgress.objects.get_or_create(user=user,term=term)
    VocabularyQuizAnswer.objects.bulk_create(rows); return attempt

@transaction.atomic
def answer_quiz(*, attempt, user, position, selected):
    """Save and score one vocabulary answer immediately.

    Each quiz answer is immutable after its first successful save. The attempt
    score is updated on every answer, and the quiz is completed automatically
    when all of its questions have been answered.

    Args:
        attempt: Quiz attempt selected by the API view.
        user: Authenticated owner of the quiz.
        position: One-based question position in the quiz.
        selected: Chosen vocabulary option.

    Returns:
        The saved answer row, with its refreshed attempt relationship.

    Raises:
        PermissionError: If the quiz belongs to another user.
        ValueError: If the quiz is closed, the answer is invalid, or the
            question has already been answered with a different option.
    """
    locked_attempt = VocabularyQuizAttempt.objects.select_for_update().get(
        pk=attempt.pk,
    )
    if locked_attempt.user_id != user.id:
        raise PermissionError("Không có quyền thay đổi bài quiz này.")

    row = VocabularyQuizAnswer.objects.select_for_update().select_related(
        "term",
    ).get(attempt=locked_attempt, position=position)

    # Treat retries of the same request as idempotent, including after the
    # final answer has automatically completed the quiz.
    if row.answered_at:
        if row.selected_value != selected:
            raise ValueError("Câu hỏi này đã được trả lời.")
        row.attempt = locked_attempt
        return row

    if locked_attempt.status != "in_progress":
        raise ValueError("Quiz đã kết thúc.")
    if selected not in row.options_json:
        raise ValueError("Đáp án không hợp lệ.")

    answered_at = timezone.now()
    row.selected_value = selected
    row.is_correct = selected == row.correct_value
    row.answered_at = answered_at
    row.save(update_fields=["selected_value", "is_correct", "answered_at"])

    progress, _ = VocabularyProgress.objects.get_or_create(
        user=user,
        term=row.term,
    )
    progress = VocabularyProgress.objects.select_for_update().get(pk=progress.pk)
    progress.seen_count += 1
    progress.last_seen_at = answered_at
    if row.is_correct:
        progress.correct_count += 1
    else:
        progress.wrong_count += 1
        progress.status = "review"
        progress.learned_at = None
    progress.save()

    locked_attempt.correct_count = locked_attempt.answers.filter(
        is_correct=True,
        answered_at__isnull=False,
    ).count()
    answered_count = locked_attempt.answers.filter(
        answered_at__isnull=False,
    ).count()
    update_fields = ["correct_count"]

    if answered_count == locked_attempt.question_count:
        locked_attempt.status = "submitted"
        locked_attempt.submitted_at = answered_at
        update_fields.extend(["status", "submitted_at"])

    locked_attempt.save(update_fields=update_fields)
    row.attempt = locked_attempt
    return row

@transaction.atomic
def submit_quiz(*, attempt, user):
    """Close a quiz and count correct answers."""
    if attempt.user_id!=user.id: raise PermissionError('Không có quyền xem bài quiz này.')
    attempt.correct_count=attempt.answers.filter(is_correct=True).count(); attempt.status='submitted'; attempt.submitted_at=timezone.now(); attempt.save(update_fields=['correct_count','status','submitted_at']); return attempt
