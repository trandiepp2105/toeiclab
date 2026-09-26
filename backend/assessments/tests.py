"""Assessment service regression tests."""
from datetime import timedelta
from types import SimpleNamespace
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from content.models import Exam,ExamPart,Question,QuestionOption
from users.models import User
from .models import TestAttempt,TestAnswer,PartScore
from .services import (
    ActiveFullTestExists,
    start_attempt,
    save_answers,
    submit_attempt,
    record_part_practice,
)
from .scoring import estimated_toeic_score,full_test_toeic_result

class AssessmentWorkflowTests(TestCase):
    def setUp(self):
        self.user=User.objects.create_user(email='learner@example.com',password='safe-test-password')
        self.exam=Exam.objects.create(external_id='sample',title='Sample TOEIC',question_count=2,answer_count=2)
        self.part=ExamPart.objects.create(exam=self.exam,part_number=5,title='Part 5',question_count=2)
        self.questions=[]
        for number,key in ((1,'B'),(2,'D')):
            question=Question.objects.create(exam_part=self.part,number=number,correct_option=key,explanation_reason='Evidence for the answer.')
            for option in 'ABCD':QuestionOption.objects.create(question=question,option_key=option,answer_text=f'choice {option}')
            self.questions.append(question)

    def test_attempt_answers_check_and_score_are_persisted(self):
        attempt=start_attempt(exam_id='sample',user=self.user,mode='part',selected_parts=[5])
        save_answers(attempt=attempt,user=self.user,answers={self.questions[0].pk:'B',self.questions[1].pk:'A'})
        answer=TestAnswer.objects.get(attempt=attempt,question=self.questions[0])
        self.assertEqual(answer.selected_option,'B')
        completed=submit_attempt(attempt_id=attempt.pk,user=self.user)
        self.assertEqual(completed.status,'submitted')
        score=PartScore.objects.get(attempt=attempt,exam_part=self.part)
        self.assertEqual((score.answered_count,score.scored_count,score.correct_count),(2,2,1))

    def test_part_practice_check_is_saved_as_a_reviewable_attempt(self):
        attempt = record_part_practice(
            user=self.user,
            questions=self.questions,
            selected_answers={
                str(self.questions[0].pk): "B",
                str(self.questions[1].pk): "A",
            },
        )

        self.assertEqual(attempt.status, "submitted")
        self.assertEqual(attempt.mode, "part")
        self.assertEqual(attempt.answers.count(), 2)
        score = PartScore.objects.get(attempt=attempt, exam_part=self.part)
        self.assertEqual(
            (score.answered_count, score.scored_count, score.correct_count),
            (2, 2, 1),
        )

    def test_part_selection_is_required(self):
        with self.assertRaises(ValueError):start_attempt(exam_id='sample',user=self.user,mode='part',selected_parts=[])

    def test_only_one_full_test_session_can_be_active_for_a_user(self):
        first_attempt = start_attempt(
            exam_id='sample',
            user=self.user,
            mode='full',
        )

        with self.assertRaises(ActiveFullTestExists) as context:
            start_attempt(
                exam_id='sample',
                user=self.user,
                mode='full',
            )

        self.assertEqual(context.exception.attempt.pk, first_attempt.pk)
        first_attempt.refresh_from_db()
        self.assertEqual(first_attempt.status, 'in_progress')

    def test_starting_a_different_full_test_abandons_the_previous_session(self):
        first_attempt = start_attempt(
            exam_id='sample',
            user=self.user,
            mode='full',
        )
        another_exam = Exam.objects.create(
            external_id='another-sample',
            title='Another TOEIC Test',
            slug='another-sample',
        )
        ExamPart.objects.create(
            exam=another_exam,
            part_number=5,
            title='Part 5',
            question_count=1,
        )

        second_attempt = start_attempt(
            exam_id='another-sample',
            user=self.user,
            mode='full',
        )

        first_attempt.refresh_from_db()
        self.assertEqual(first_attempt.status, 'abandoned')
        self.assertEqual(second_attempt.status, 'in_progress')

    def test_full_attempt_question_position_is_persisted(self):
        attempt = start_attempt(
            exam_id='sample',
            user=self.user,
            mode='full',
        )
        attempt.current_question_index = 1
        attempt.save(update_fields=['current_question_index'])

        resumed_attempt = TestAttempt.objects.get(pk=attempt.pk)

        self.assertEqual(resumed_attempt.current_question_index, 1)

    def test_answer_must_be_an_available_option(self):
        attempt=start_attempt(exam_id='sample',user=self.user,mode='part',selected_parts=[5])
        with self.assertRaises(ValueError):save_answers(attempt=attempt,user=self.user,answers={self.questions[0].pk:'Z'})

    def test_answers_are_rejected_after_server_deadline(self):
        attempt=start_attempt(exam_id='sample',user=self.user,mode='part',selected_parts=[5],time_limit_seconds=300)
        attempt.started_at=timezone.now()-timedelta(seconds=301)
        attempt.save(update_fields=['started_at'])

        with self.assertRaisesMessage(ValueError,'Thời gian làm bài đã hết'):
            save_answers(attempt=attempt,user=self.user,answers={self.questions[0].pk:'B'})

    def test_assessment_and_part_practice_apis_require_login(self):
        client=APIClient()
        assessment_response=client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id':'sample','mode':'full'},
            format='json',
        )
        practice_response=client.get('/api/v1/content/practice/parts/')

        self.assertEqual(assessment_response.status_code,401)
        self.assertEqual(practice_response.status_code,401)

    def test_authenticated_user_can_start_assessment_through_api(self):
        client=APIClient()
        client.force_authenticate(user=self.user)

        response=client.post(
            '/api/v1/assessments/attempts/',
            {'exam_id':'sample','mode':'full'},
            format='json',
        )

        self.assertEqual(response.status_code,201)
        self.assertEqual(response.data['mode'],'full')

    def test_full_test_returns_estimated_toeic_score(self):
        scores=[
            SimpleNamespace(exam_part=SimpleNamespace(part_number=part),correct_count=10,scored_count=10)
            for part in range(1,8)
        ]
        result=full_test_toeic_result(SimpleNamespace(mode='full'),scores)

        self.assertTrue(result['is_estimate'])
        self.assertEqual(result['total_score'],990)
        self.assertEqual(estimated_toeic_score(0,100),5)
