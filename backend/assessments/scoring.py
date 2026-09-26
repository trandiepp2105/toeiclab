"""Assessment timing and estimated TOEIC score conversion helpers."""

from datetime import timedelta

from django.utils import timezone


def attempt_deadline(attempt):
    """Return the server-side deadline for an attempt, if it is timed."""
    if not attempt.time_limit_seconds:
        return None

    started_at = attempt.exam_started_at if attempt.mode == 'full' else attempt.started_at
    if started_at is None:
        return None

    return started_at + timedelta(seconds=attempt.time_limit_seconds)


def attempt_time_state(attempt, now=None):
    """Return deadline, remaining seconds and expiration state from server time."""
    deadline = attempt_deadline(attempt)

    if deadline is None:
        return {"deadline_at": None, "remaining_seconds": None, "time_expired": False}

    current_time = now or timezone.now()
    remaining_seconds = max(0, int((deadline - current_time).total_seconds()))

    return {
        "deadline_at": deadline,
        "remaining_seconds": remaining_seconds,
        "time_expired": current_time >= deadline,
    }


def estimated_toeic_score(correct_count, scored_count):
    """Convert a raw section result to an estimated 5–495 TOEIC score.

    ETS uses test-specific conversion tables. Because the imported bank does
    not contain an official conversion table for every exam, this application
    exposes a transparent linear estimate instead of presenting it as an
    official score.
    """
    if not scored_count:
        return 0

    ratio = max(0, min(1, correct_count / scored_count))
    return round(5 + (490 * ratio))


def full_test_toeic_result(attempt, part_scores):
    """Build Listening/Reading/total estimates for a full seven-part test."""
    if attempt.mode != "full":
        return None

    listening_parts = {score.exam_part.part_number for score in part_scores}
    if not {1, 2, 3, 4}.issubset(listening_parts):
        return None

    if not {5, 6, 7}.issubset(listening_parts):
        return None

    listening = [score for score in part_scores if score.exam_part.part_number <= 4]
    reading = [score for score in part_scores if score.exam_part.part_number >= 5]

    listening_correct = sum(score.correct_count for score in listening)
    listening_total = sum(score.scored_count for score in listening)
    reading_correct = sum(score.correct_count for score in reading)
    reading_total = sum(score.scored_count for score in reading)
    listening_score = estimated_toeic_score(listening_correct, listening_total)
    reading_score = estimated_toeic_score(reading_correct, reading_total)

    return {
        "is_estimate": True,
        "listening": {
            "correct_count": listening_correct,
            "scored_count": listening_total,
            "score": listening_score,
        },
        "reading": {
            "correct_count": reading_correct,
            "scored_count": reading_total,
            "score": reading_score,
        },
        "total_score": listening_score + reading_score,
    }
