"""Tests for public, read-only exam content endpoints."""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User

from .models import Exam, ExamPart, Question, QuestionOption


class ExamAnswerTranscriptApiTests(TestCase):
    """The exam answer guide requires a signed-in user."""

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

    def test_anonymous_user_cannot_read_answer_guide(self):
        response = APIClient().get(
            f"/api/v1/content/exams/{self.exam.slug}/answers-transcripts/"
        )

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_read_answer_guide_without_submitting_attempt(self):
        user = User.objects.create_user(
            email='answer-reader@example.test',
            password='Initial!Stone39',
            email_verified=True,
        )
        access_token = RefreshToken.for_user(user).access_token
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = client.get(
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

    def test_public_question_does_not_expose_correct_answer(self):
        client = APIClient()
        list_response = client.get('/api/v1/content/exams/')
        detail_response = client.get(
            f'/api/v1/content/exams/{self.exam.slug}/'
        )
        response = client.get(
            f"/api/v1/content/questions/{self.question.pk}/"
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("correct_answer", response.data)

    def test_openapi_marks_answer_guide_as_jwt_protected(self):
        response = APIClient().get('/api/schema/')

        self.assertEqual(response.status_code, 200)
        operation = response.data['paths'][
            '/api/v1/content/exams/{exam_slug}/answers-transcripts/'
        ]['get']
        self.assertEqual(operation.get('security'), [{'jwtAuth': []}])

        public_question_operation = response.data['paths'][
            '/api/v1/content/questions/{question_id}/'
        ]['get']
        self.assertIn({}, public_question_operation.get('security', []))

    def test_profile_and_assessment_history_reject_anonymous_requests(self):
        client = APIClient()

        profile_response = client.get('/api/v1/auth/me/')
        history_response = client.get('/api/v1/assessments/history/')

        self.assertEqual(profile_response.status_code, 401)
        self.assertEqual(history_response.status_code, 401)

    def test_unknown_exam_returns_not_found(self):
        user = User.objects.create_user(
            email='unknown-exam-reader@example.test',
            password='Initial!Stone39',
            email_verified=True,
        )
        client = APIClient()
        client.force_authenticate(user)

        response = client.get(
            "/api/v1/content/exams/unknown-exam/answers-transcripts/"
        )

        self.assertEqual(response.status_code, 404)
