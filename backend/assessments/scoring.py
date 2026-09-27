"""Assessment timing and versioned estimated TOEIC score conversion."""

from datetime import timedelta

from django.utils import timezone


DEFAULT_SCORING_VERSION = "TOEIC_ESTIMATE_V1"
LEGACY_SCORING_VERSION = "TOEIC_ESTIMATE_LEGACY"
PART_QUESTION_COUNTS = {1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54}


def _build_conversion_table():
    """Encode the supplied raw-score lookup, including the two capped values."""
    return {0: 5, **{raw_score: raw_score * 5 for raw_score in range(1, 99)}, 99: 495, 100: 495}


# Kept as separate section tables so future versions can diverge by section.
LISTENING_CONVERSION_TABLES = {DEFAULT_SCORING_VERSION: _build_conversion_table()}
READING_CONVERSION_TABLES = {DEFAULT_SCORING_VERSION: _build_conversion_table()}


def attempt_deadline(attempt):
    """Return the server-side deadline for an attempt, if it is timed."""
    if not attempt.time_limit_seconds:
        return None

    started_at = attempt.exam_started_at if attempt.mode == "full" else attempt.started_at
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


def estimated_toeic_score(correct_count, section, scoring_version=DEFAULT_SCORING_VERSION):
    """Look up a full-section raw score in its versioned conversion table.

    Args:
        correct_count: Integer raw score from 0 to 100.
        section: Either ``"listening"`` or ``"reading"``.
        scoring_version: Conversion table version to apply.

    Returns:
        The estimated scaled score from 5 to 495.

    Raises:
        ValueError: If the section, version, or raw score is invalid.
    """
    if not isinstance(correct_count, int) or not 0 <= correct_count <= 100:
        raise ValueError("Raw TOEIC section score must be an integer from 0 to 100.")

    section_tables = {
        "listening": LISTENING_CONVERSION_TABLES,
        "reading": READING_CONVERSION_TABLES,
    }
    if section not in section_tables:
        raise ValueError("Section must be listening or reading.")

    table = section_tables[section].get(scoring_version)
    if table is None:
        raise ValueError(f"Unknown TOEIC scoring version: {scoring_version}.")
    return table[correct_count]


def _part_result(score):
    """Return the validated raw score details for one Part."""
    part_number = score.exam_part.part_number
    return {
        "part_number": part_number,
        "correct_count": score.correct_count,
        "total_count": getattr(
            score.exam_part,
            "question_count",
            PART_QUESTION_COUNTS.get(part_number, 0),
        ),
        "scored_count": score.scored_count,
    }


def _legacy_full_test_result(part_scores):
    """Recreate the former ratio-based estimate for versioned old attempts."""
    available_parts = {score.exam_part.part_number for score in part_scores}
    if not set(PART_QUESTION_COUNTS).issubset(available_parts):
        return {
            "is_estimate": False,
            "is_valid": False,
            "scoring_version": LEGACY_SCORING_VERSION,
            "validation_errors": ["The historical attempt is missing one or more Part scores."],
            "part_breakdown": [_part_result(score) for score in part_scores],
        }

    listening = [score for score in part_scores if score.exam_part.part_number <= 4]
    reading = [score for score in part_scores if score.exam_part.part_number >= 5]
    listening_correct = sum(score.correct_count for score in listening)
    listening_total = sum(score.scored_count for score in listening)
    reading_correct = sum(score.correct_count for score in reading)
    reading_total = sum(score.scored_count for score in reading)

    def legacy_conversion(correct_count, scored_count):
        if not scored_count:
            return 0
        ratio = max(0, min(1, correct_count / scored_count))
        return round(5 + (490 * ratio))

    return {
        "is_estimate": True,
        "is_valid": True,
        "scoring_version": LEGACY_SCORING_VERSION,
        "listening": {
            "correct_count": listening_correct,
            "scored_count": listening_total,
            "score": legacy_conversion(listening_correct, listening_total),
        },
        "reading": {
            "correct_count": reading_correct,
            "scored_count": reading_total,
            "score": legacy_conversion(reading_correct, reading_total),
        },
        "total_score": legacy_conversion(listening_correct, listening_total)
        + legacy_conversion(reading_correct, reading_total),
        "part_breakdown": sorted(
            [_part_result(score) for score in part_scores],
            key=lambda item: item["part_number"],
        ),
    }


def full_test_toeic_result(
    attempt,
    part_scores,
    scoring_version=None,
):
    """Validate a complete 200-question full test and return its estimated score.

    Incomplete or inconsistent attempts return validation errors and no scaled
    score. Part-practice and subset attempts do not receive a TOEIC estimate.
    """
    if attempt.mode != "full":
        return None

    scoring_version = (
        scoring_version
        or getattr(attempt, "scoring_version", None)
        or DEFAULT_SCORING_VERSION
    )
    if scoring_version == LEGACY_SCORING_VERSION:
        return _legacy_full_test_result(part_scores)

    scores_by_part = {}
    validation_errors = []
    part_breakdown = []

    for score in part_scores:
        part_number = score.exam_part.part_number
        if part_number not in PART_QUESTION_COUNTS:
            validation_errors.append(f"Part {part_number} is not part of TOEIC Listening & Reading.")
            continue
        if part_number in scores_by_part:
            validation_errors.append(f"Part {part_number} has duplicate score records.")
            continue
        scores_by_part[part_number] = score
        part_breakdown.append(_part_result(score))

    for part_number, expected_count in PART_QUESTION_COUNTS.items():
        score = scores_by_part.get(part_number)
        if score is None:
            validation_errors.append(f"Part {part_number} is missing; expected {expected_count} questions.")
            continue
        actual_count = getattr(score.exam_part, "question_count", score.scored_count)
        if actual_count != expected_count:
            validation_errors.append(
                f"Part {part_number} contains {actual_count} questions; expected {expected_count}."
            )
        if score.scored_count != actual_count:
            validation_errors.append(
                f"Part {part_number} has {score.scored_count} answer-keyed questions "
                f"out of {actual_count}."
            )
        if not 0 <= score.correct_count <= score.scored_count:
            validation_errors.append(
                f"Part {part_number} correct count must be between 0 and {score.scored_count}."
            )

    listening_total = sum(
        scores_by_part[part].scored_count
        for part in range(1, 5)
        if part in scores_by_part
    )
    reading_total = sum(
        scores_by_part[part].scored_count
        for part in range(5, 8)
        if part in scores_by_part
    )
    if listening_total != 100:
        validation_errors.append(f"Listening has {listening_total} answer-keyed questions; expected 100.")
    if reading_total != 100:
        validation_errors.append(f"Reading has {reading_total} answer-keyed questions; expected 100.")

    part_breakdown.sort(key=lambda item: item["part_number"])
    if validation_errors:
        return {
            "is_estimate": False,
            "is_valid": False,
            "scoring_version": scoring_version,
            "validation_errors": validation_errors,
            "part_breakdown": part_breakdown,
        }

    listening_correct = sum(scores_by_part[part].correct_count for part in range(1, 5))
    reading_correct = sum(scores_by_part[part].correct_count for part in range(5, 8))
    try:
        listening_scaled = estimated_toeic_score(listening_correct, "listening", scoring_version)
        reading_scaled = estimated_toeic_score(reading_correct, "reading", scoring_version)
    except ValueError as error:
        return {
            "is_estimate": False,
            "is_valid": False,
            "scoring_version": scoring_version,
            "validation_errors": [str(error)],
            "part_breakdown": part_breakdown,
        }

    return {
        "is_estimate": True,
        "is_valid": True,
        "scoring_version": scoring_version,
        "listening": {
            "correct_count": listening_correct,
            "scored_count": 100,
            "score": listening_scaled,
        },
        "reading": {
            "correct_count": reading_correct,
            "scored_count": 100,
            "score": reading_scaled,
        },
        "total_score": listening_scaled + reading_scaled,
        "part_breakdown": part_breakdown,
    }
