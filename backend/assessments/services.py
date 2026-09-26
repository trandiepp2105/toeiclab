"""Use cases for timed tests and untimed part practice."""
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from content.models import Exam, Question, QuestionOption
from .models import TestAttempt, AttemptPart, TestAnswer, PartScore
from .scoring import attempt_time_state


class ActiveFullTestExists(Exception):
    """Raised when this user already has a resumable full-test session."""

    def __init__(self, attempt):
        self.attempt = attempt
        super().__init__('Bạn đang có một bài thi full test chưa hoàn thành.')

@transaction.atomic
def start_attempt(*, exam_id, user, mode='full', selected_parts=None, time_limit_seconds=None):
    """Create an authenticated attempt and freeze its selected exam parts."""
    if not getattr(user, 'is_authenticated', False):
        raise ValueError('Đăng nhập để bắt đầu làm bài thi.')
    exam=Exam.objects.get(external_id=str(exam_id))

    if mode == 'full':
        # Serializing full-test creation per user prevents two browser requests
        # from leaving multiple resumable sessions active at the same time.
        get_user_model().objects.select_for_update().get(pk=user.pk)
        active_attempts = list(
            TestAttempt.objects.select_for_update()
            .filter(user=user, mode='full', status='in_progress')
            .select_related('exam')
            .order_by('-started_at')
        )
        now = timezone.now()
        valid_attempts = []

        for active_attempt in active_attempts:
            if attempt_time_state(active_attempt, now=now)['time_expired']:
                active_attempt.status = 'abandoned'
                active_attempt.save(update_fields=['status', 'last_activity_at'])
            else:
                valid_attempts.append(active_attempt)

        same_exam_attempt = next(
            (
                active_attempt
                for active_attempt in valid_attempts
                if active_attempt.exam_id == exam.id
            ),
            None,
        )
        if same_exam_attempt:
            raise ActiveFullTestExists(same_exam_attempt)

        if valid_attempts:
            TestAttempt.objects.filter(
                pk__in=[active_attempt.pk for active_attempt in valid_attempts]
            ).update(status='abandoned', last_activity_at=now)

    parts=list(exam.parts.all()); selected={int(p) for p in (selected_parts or [])}
    if mode=='part' and len(selected)!=1: raise ValueError('Chọn đúng một Part để luyện.')
    if mode=='subset' and not selected: raise ValueError('Chọn ít nhất một Part.')
    chosen=[p for p in parts if mode=='full' or p.part_number in selected]
    if not chosen: raise ValueError('Đề thi chưa có câu hỏi.')
    attempt=TestAttempt.objects.create(exam=exam,user=user,mode=mode,time_limit_seconds=time_limit_seconds if mode!='full' else exam.time_limit_seconds)
    AttemptPart.objects.bulk_create([AttemptPart(attempt=attempt,exam_part=p,position=i) for i,p in enumerate(chosen)])
    TestAnswer.objects.bulk_create([TestAnswer(attempt=attempt,question=q) for q in Question.objects.filter(exam_part__in=chosen)])
    return attempt


@transaction.atomic
def save_attempt_progress(*, attempt_id, user, current_question_index):
    """Persist the full-test cursor so a valid session can resume where it stopped.

    Args:
        attempt_id: UUID identifying the test attempt.
        user: Authenticated owner of the attempt.
        current_question_index: Zero-based position in the serialized question list.

    Returns:
        The updated `TestAttempt`.

    Raises:
        PermissionError: If the request is anonymous or the attempt belongs to another user.
        ValueError: If the attempt is closed, untimed, expired, or the index is invalid.
    """
    attempt = TestAttempt.objects.select_for_update().get(pk=attempt_id)
    if not getattr(user, 'is_authenticated', False) or attempt.user_id != user.pk:
        raise PermissionError('Đăng nhập bằng đúng tài khoản để lưu tiến độ.')
    if attempt.mode != 'full':
        raise ValueError('Chỉ có thể lưu vị trí câu hỏi của full test.')
    if attempt.status != 'in_progress':
        raise ValueError('Bài thi đã kết thúc.')
    if attempt.exam_started_at is None:
        raise ValueError('Bấm Bắt đầu trước khi lưu tiến độ bài thi.')
    if attempt_time_state(attempt)['time_expired']:
        raise ValueError('Thời gian làm bài đã hết. Hãy nộp bài để xem kết quả.')

    question_count = attempt.answers.count()
    if question_count == 0 or current_question_index >= question_count:
        raise ValueError('Vị trí câu hỏi không hợp lệ.')

    attempt.current_question_index = current_question_index
    attempt.save(update_fields=['current_question_index', 'last_activity_at'])
    return attempt

@transaction.atomic
def save_answers(*, attempt, user, answers):
    """Upsert batch answers after checking attempt scope and status."""
    attempt=TestAttempt.objects.select_for_update().get(pk=attempt.pk)
    if not getattr(user, 'is_authenticated', False) or attempt.user_id != user.pk:
        raise PermissionError('Đăng nhập bằng đúng tài khoản để lưu câu trả lời.')
    if attempt.status!='in_progress': raise ValueError('Bài thi đã kết thúc.')
    if attempt.mode == 'full' and attempt.exam_started_at is None:
        raise ValueError('Bấm Bắt đầu trước khi trả lời câu hỏi.')
    if attempt_time_state(attempt)['time_expired']:
        raise ValueError('Thời gian làm bài đã hết. Hãy nộp bài để xem kết quả.')
    allowed=set(attempt.answers.values_list('question_id',flat=True))
    for question_id,option in answers.items():
        if int(question_id) not in allowed: raise ValueError('Câu hỏi không thuộc bài thi này.')
        selected=str(option).upper()[:1]
        if selected not in 'ABCD' or not QuestionOption.objects.filter(question_id=question_id,option_key=selected).exists(): raise ValueError('Lựa chọn đáp án không hợp lệ.')
        TestAnswer.objects.filter(attempt=attempt,question_id=question_id).update(selected_option=selected,answered_at=timezone.now())
    return attempt

@transaction.atomic
def submit_attempt(*, attempt_id, user):
    """Score official-key answers and close the attempt atomically."""
    attempt=TestAttempt.objects.select_for_update().select_related('exam').get(pk=attempt_id)
    if not getattr(user, 'is_authenticated', False) or attempt.user_id!=user.id: raise PermissionError('Không có quyền xem bài thi này.')
    if attempt.status=='submitted': return attempt
    if attempt.status != 'in_progress': raise ValueError('Bài thi này đã bị hủy hoặc không còn hiệu lực.')
    if attempt.mode == 'full' and attempt.exam_started_at is None:
        raise ValueError('Bấm Bắt đầu trước khi nộp bài thi.')
    scores=[]
    for part in attempt.selected_parts.select_related('exam_part'):
        answers=TestAnswer.objects.filter(attempt=attempt,question__exam_part=part.exam_part).select_related('question'); correct=answered=scored=0
        for answer in answers:
            if answer.selected_option: answered+=1
            key=answer.question.correct_option; answer.is_correct=(answer.selected_option==key) if key else None
            if key: scored+=1; correct+=int(answer.is_correct is True)
            answer.save(update_fields=['is_correct'])
        scores.append(PartScore(attempt=attempt,exam_part=part.exam_part,answered_count=answered,scored_count=scored,correct_count=correct,score_percent=(100*correct/scored if scored else 0)))
    PartScore.objects.filter(attempt=attempt).delete(); PartScore.objects.bulk_create(scores)
    attempt.status='submitted'; attempt.submitted_at=timezone.now(); attempt.save(update_fields=['status','submitted_at','last_activity_at']); return attempt


@transaction.atomic
def record_part_practice(*, user, questions, selected_answers):
    """Persist one checked Part-practice question or passage group as a result.

    Args:
        user: Authenticated learner who submitted the answers.
        questions: Question objects, all belonging to one exam Part.
        selected_answers: Mapping of question IDs to validated option keys.

    Returns:
        The completed TestAttempt used by history, dashboard statistics, and
        answer review.

    Raises:
        ValueError: If the batch is empty or spans multiple exam Parts.
    """
    if not questions:
        raise ValueError("Không có câu hỏi để lưu kết quả luyện tập.")
    if not getattr(user, "is_authenticated", False):
        raise ValueError("Đăng nhập để lưu kết quả luyện tập.")

    exam_part = questions[0].exam_part
    if any(question.exam_part_id != exam_part.id for question in questions):
        raise ValueError("Một lượt luyện chỉ được chứa câu hỏi của cùng một Part.")

    completed_at = timezone.now()
    attempt = TestAttempt.objects.create(
        user=user,
        exam=exam_part.exam,
        mode="part",
        status="submitted",
        submitted_at=completed_at,
    )
    AttemptPart.objects.create(
        attempt=attempt,
        exam_part=exam_part,
        position=0,
    )

    answers = []
    correct_count = 0
    scored_count = 0
    for question in questions:
        selected_option = selected_answers[str(question.pk)]
        is_scored = bool(question.correct_option)
        is_correct = (
            selected_option == question.correct_option if is_scored else None
        )
        scored_count += int(is_scored)
        correct_count += int(is_correct is True)
        answers.append(
            TestAnswer(
                attempt=attempt,
                question=question,
                selected_option=selected_option,
                is_correct=is_correct,
                answered_at=completed_at,
            )
        )

    TestAnswer.objects.bulk_create(answers)
    PartScore.objects.create(
        attempt=attempt,
        exam_part=exam_part,
        answered_count=len(answers),
        scored_count=scored_count,
        correct_count=correct_count,
        score_percent=(100 * correct_count / scored_count) if scored_count else 0,
    )
    return attempt
