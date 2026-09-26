"""Tests for public, read-only exam content endpoints."""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Exam, ExamPart, Question, QuestionOption


class ExamAnswerTranscriptApiTests(TestCase):
    """The exam detail answer tab can read answer data without an attempt."""

    def setUp(self):
        self.exam = Exam.objects.create(
            external_id="answer-guide-sample",
            slug="answer-guide-sample",
            title="Answer Guide Sample",
            question_count=1,
            answer_count=1,
        )
        self.part = ExamPart.objects.create(
            exam=self.exam,
            part_number=5,
            title="Incomplete Sentences",
            question_count=1,
        )
        self.question = Question.objects.create(
            exam_part=self.part,
            number=101,
            prompt="The agreement was ___ by both companies.",
            correct_option="B",
            explanation_reason="The sentence requires a past participle.",
            transcript="Optional listening transcript.",
        )
        for option_key in "ABCD":
            QuestionOption.objects.create(
                question=self.question,
                option_key=option_key,
                answer_text=f"Option {option_key}",
            )

    def test_answer_guide_is_available_without_submitting_an_attempt(self):
        response = APIClient().get(
            f"/api/v1/content/exams/{self.exam.slug}/answers-transcripts/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["exam"]["slug"], self.exam.slug)
        self.assertEqual(len(response.data["parts"]), 1)

        question = response.data["parts"][0]["questions"][0]
        self.assertEqual(question["correct_answer"], "B")
        self.assertEqual(question["explanation"]["reason"], self.question.explanation_reason)
        self.assertEqual(question["transcript"], self.question.transcript)
        self.assertEqual(question["options"]["B"], "Option B")

    def test_unknown_exam_returns_not_found(self):
        response = APIClient().get(
            "/api/v1/content/exams/unknown-exam/answers-transcripts/"
        )

        self.assertEqual(response.status_code, 404)
