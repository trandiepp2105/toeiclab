"""API tests for authentication and account-security workflows."""
import re
from datetime import timedelta
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import OtpChallenge, User
from assessments.models import TestAttempt
from content.models import Direction, Exam, ExamPart, Question
from vocabulary.models import VocabularyTerm
from learning.services import create_quiz


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='TOEICLab <no-reply@example.test>',
)
class PasswordResetApiTests(TestCase):
    """Cover password-reset email delivery, OTP verification, and one-time use."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='learner@example.test',
            password='Initial!Stone39',
            display_name='TOEIC Learner',
            email_verified=True,
        )

    def test_verified_otp_changes_password_and_cannot_be_reused(self):
        """Only the verified email flow can change the password, once."""
        request_response = self.client.post(
            '/api/v1/auth/password-reset/request-otp/',
            {'email': self.user.email},
            format='json',
        )
        self.assertEqual(request_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        otp = re.search(r'(?<!\d)(\d{6})(?!\d)', mail.outbox[0].body).group(1)
        verify_response = self.client.post(
            '/api/v1/auth/password-reset/verify-otp/',
            {'email': self.user.email, 'otp': otp},
            format='json',
        )
        self.assertEqual(verify_response.status_code, 200)
        reset_token = verify_response.data['reset_token']

        completion_response = self.client.post(
            '/api/v1/auth/password-reset/complete/',
            {
                'reset_token': reset_token,
                'new_password': 'Freshly!River29-Quartz',
            },
            format='json',
        )
        self.assertEqual(completion_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Freshly!River29-Quartz'))
        self.assertFalse(
            OtpChallenge.objects.filter(purpose='password_reset').exists()
        )

        replay_response = self.client.post(
            '/api/v1/auth/password-reset/complete/',
            {
                'reset_token': reset_token,
                'new_password': 'Another!River29-Quartz',
            },
            format='json',
        )
        self.assertEqual(replay_response.status_code, 400)

    def test_unknown_email_gets_generic_response_without_sending_mail(self):
        """The request endpoint does not reveal whether an account exists."""
        response = self.client.post(
            '/api/v1/auth/password-reset/request-otp/',
            {'email': 'unknown@example.test'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(
            response.data['message'],
            'Nếu email đã đăng ký, hướng dẫn xác nhận sẽ được gửi tới hộp thư.',
        )


class JwtRefreshApiTests(TestCase):
    """Ensure an expired access JWT does not block refresh-token exchange."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='refresh-learner@example.test',
            password='Initial!Stone39',
            email_verified=True,
        )

    def test_expired_access_header_does_not_block_valid_refresh_token(self):
        refresh_token = RefreshToken.for_user(self.user)
        expired_access_token = refresh_token.access_token
        expired_access_token.set_exp(lifetime=timedelta(seconds=-1))

        response = self.client.post(
            '/api/v1/auth/refresh-token/',
            {'refresh': str(refresh_token)},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {expired_access_token}',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('access'))


class FullTestStartApiTests(TestCase):
    """Verify that a full-test clock starts only after the direction screen."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test-taker@example.test',
            password='Initial!Stone39',
            email_verified=True,
        )
        self.client.force_authenticate(self.user)
        self.exam = Exam.objects.create(
            external_id='direction-test',
            title='Direction Test',
            slug='direction-test',
            time_limit_seconds=7200,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=1,
            title='Photographs',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=2,
            title='Question-Response',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=3,
            title='Conversations',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=4,
            title='Talks',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=5,
            title='Incomplete Sentences',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=6,
            title='Text Completion',
            question_count=0,
        )
        ExamPart.objects.create(
            exam=self.exam,
            part_number=7,
            title='Reading Comprehension',
            question_count=0,
        )
        Direction.objects.create(
            part_number=1,
            title='Part 1',
            direction_html='<p>Read the directions.</p>',
            image_path='directions/image-direction-part-1.jpg',
            example_html='<p>Choose C.</p>',
        )
        Direction.objects.create(
            part_number=2,
            title='Part 2',
            direction_html='<p>Listen to the question and responses.</p>',
            sort_order=2,
        )
        Direction.objects.create(
            part_number=3,
            title='Part 3',
            direction_html='<p>Listen to the conversations.</p>',
            sort_order=3,
        )
        Direction.objects.create(
            part_number=4,
            title='Part 4',
            direction_html='<p>Listen to the talks.</p>',
            sort_order=4,
        )
        Direction.objects.create(
            part_number=5,
            title='Part 5',
            direction_html='<p>Read and complete the sentences.</p>',
            sort_order=5,
        )
        Direction.objects.create(
            part_number=6,
            title='Part 6',
            direction_html='<p>Read and complete the text.</p>',
            sort_order=6,
        )
        Direction.objects.create(
            part_number=7,
            title='Part 7',
            direction_html='<p>Read the texts and answer the questions.</p>',
            sort_order=7,
        )

    def test_full_attempt_deadline_begins_only_after_start_action(self):
        """An attempt stays untimed until the user presses the start button."""
        create_response = self.client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id': self.exam.external_id, 'mode': 'full'},
            format='json',
        )
        self.assertEqual(create_response.status_code, 201)
        attempt_id = create_response.data['id']
        attempt = TestAttempt.objects.get(pk=attempt_id)
        self.assertIsNone(attempt.exam_started_at)
        self.assertIsNone(create_response.data['deadline_at'])
        self.assertEqual(
            [direction['part_number'] for direction in create_response.data['directions']],
            [1, 2, 3, 4, 5, 6, 7],
        )

        start_response = self.client.post(
            f'/api/v1/assessments/attempts/{attempt_id}/start/',
            {},
            format='json',
        )
        self.assertEqual(start_response.status_code, 200)
        attempt.refresh_from_db()
        self.assertIsNotNone(attempt.exam_started_at)
        self.assertIsNotNone(start_response.data['deadline_at'])

    def test_same_exam_attempt_conflict_returns_resumable_session(self):
        first_response = self.client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id': self.exam.external_id, 'mode': 'full'},
            format='json',
        )

        second_response = self.client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id': self.exam.external_id, 'mode': 'full'},
            format='json',
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 409)
        self.assertEqual(second_response.data['code'], 'active_full_test_exists')
        self.assertEqual(
            second_response.data['active_attempt']['id'],
            first_response.data['id'],
        )

    def test_question_position_can_be_saved_and_loaded_for_resume(self):
        first_question = Question.objects.create(
            exam_part=self.exam.parts.get(part_number=1),
            number=1,
            title='First sample question',
        )
        Question.objects.create(
            exam_part=self.exam.parts.get(part_number=1),
            number=2,
            title='Second sample question',
        )
        create_response = self.client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id': self.exam.external_id, 'mode': 'full'},
            format='json',
        )
        attempt_id = create_response.data['id']
        self.client.post(
            f'/api/v1/assessments/attempts/{attempt_id}/start/',
            {},
            format='json',
        )

        progress_response = self.client.put(
            f'/api/v1/assessments/attempts/{attempt_id}/progress/',
            {'current_question_index': 1},
            format='json',
        )
        detail_response = self.client.get(
            f'/api/v1/assessments/attempts/{attempt_id}/',
        )

        self.assertEqual(progress_response.status_code, 200)
        self.assertEqual(progress_response.data['current_question_index'], 1)
        self.assertEqual(detail_response.data['current_question_index'], 1)
        self.assertEqual(detail_response.data['questions'][0]['id'], first_question.pk)


class VocabularyQuizStatisticsApiTests(TestCase):
    """Ensure each saved answer is reflected in learning statistics at once."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='quiz-learner@example.test',
            password='Initial!Stone39',
            email_verified=True,
        )
        self.client.force_authenticate(self.user)

        for index in range(12):
            VocabularyTerm.objects.create(
                word=f'quiz-word-{index}',
                meaning_vi=f'nghia quiz {index}',
            )

        self.quiz = create_quiz(
            user=self.user,
            question_count=10,
            question_types=['en_to_vi'],
        )

    def test_answer_updates_dashboard_and_learning_progress_immediately(self):
        answer = self.quiz.answers.first()
        answer_response = self.client.post(
            f'/api/v1/learning/quizzes/{self.quiz.pk}/answers/',
            {
                'position': answer.position,
                'selected_value': answer.correct_value,
            },
            format='json',
        )

        dashboard_response = self.client.get('/api/v1/dashboard/summary/')
        progress_response = self.client.get('/api/v1/learning/progress/')
        history_response = self.client.get('/api/v1/learning/quizzes/history/')

        self.assertEqual(answer_response.status_code, 200)
        self.assertEqual(answer_response.data['answered_count'], 1)
        self.assertEqual(answer_response.data['correct_count'], 1)
        self.assertEqual(answer_response.data['status'], 'in_progress')
        self.assertEqual(dashboard_response.status_code, 200)
        self.assertEqual(dashboard_response.data['vocabulary']['quiz_count'], 1)
        self.assertEqual(
            dashboard_response.data['vocabulary']['quiz_correct_count'],
            1,
        )
        self.assertEqual(
            dashboard_response.data['vocabulary']['quiz_answered_count'],
            1,
        )
        self.assertEqual(
            dashboard_response.data['vocabulary']['quiz_accuracy'],
            100,
        )
        self.assertEqual(progress_response.data['quiz_count'], 1)
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(history_response.data[0]['answered_count'], 1)
        self.assertEqual(history_response.data[0]['correct_count'], 1)
