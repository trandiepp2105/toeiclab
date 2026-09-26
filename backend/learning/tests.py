"""Vocabulary quiz rule and review-state regression tests."""
from django.test import TestCase
from users.models import User
from vocabulary.models import VocabularyTopic,VocabularyTerm,TopicTerm
from .models import VocabularyProgress,VocabularyQuizAnswer
from .services import create_quiz,answer_quiz

class VocabularyQuizTests(TestCase):
    def setUp(self):
        self.user=User.objects.create_user(email='student@example.com',password='sample-password')
        self.topic=VocabularyTopic.objects.create(slug='office',name='Office')
        self.terms=[]
        for i in range(12):
            term=VocabularyTerm.objects.create(word=f'word{i}',meaning_vi=f'nghia {i}',example_en=f'Example {i}')
            TopicTerm.objects.create(topic=self.topic,term=term,sort_order=i);self.terms.append(term)

    def test_quiz_only_creates_bilingual_question_types(self):
        quiz=create_quiz(user=self.user,scope='topic',topic_id=self.topic.pk,question_count=10,question_types=['vi_to_en','en_to_vi'])
        self.assertEqual(quiz.answers.count(),10)
        self.assertLessEqual(set(quiz.answers.values_list('prompt_type',flat=True)),{'vi_to_en','en_to_vi'})
        self.assertTrue(all(len(item.options_json)==4 for item in quiz.answers.all()))

    def test_audio_question_type_is_rejected(self):
        with self.assertRaises(ValueError):create_quiz(user=self.user,question_count=10,question_types=['audio_to_word'])

    def test_wrong_answer_moves_term_to_review(self):
        quiz=create_quiz(user=self.user,scope='topic',topic_id=self.topic.pk,question_count=10,question_types=['en_to_vi'])
        answer=quiz.answers.first();wrong=next(item for item in answer.options_json if item!=answer.correct_value)
        answer_quiz(attempt=quiz,user=self.user,position=answer.position,selected=wrong)
        self.assertEqual(VocabularyProgress.objects.get(user=self.user,term=answer.term).status,'review')

    def test_each_answer_updates_score_and_last_answer_completes_quiz(self):
        quiz = create_quiz(
            user=self.user,
            scope='topic',
            topic_id=self.topic.pk,
            question_count=10,
            question_types=['en_to_vi'],
        )
        answer_rows = list(quiz.answers.all())

        for answer in answer_rows[:-1]:
            answer_quiz(
                attempt=quiz,
                user=self.user,
                position=answer.position,
                selected=answer.correct_value,
            )

        quiz.refresh_from_db()
        self.assertEqual(quiz.status, 'in_progress')
        self.assertEqual(quiz.correct_count, len(answer_rows) - 1)

        final_answer = answer_rows[-1]
        saved_answer = answer_quiz(
            attempt=quiz,
            user=self.user,
            position=final_answer.position,
            selected=final_answer.correct_value,
        )

        quiz.refresh_from_db()
        self.assertEqual(saved_answer.attempt.status, 'submitted')
        self.assertEqual(quiz.status, 'submitted')
        self.assertEqual(quiz.correct_count, len(answer_rows))
        self.assertIsNotNone(quiz.submitted_at)

        # Retrying the same final request must not count the term twice.
        answer_quiz(
            attempt=quiz,
            user=self.user,
            position=final_answer.position,
            selected=final_answer.correct_value,
        )
        progress = VocabularyProgress.objects.get(
            user=self.user,
            term=final_answer.term,
        )
        self.assertEqual(progress.seen_count, 1)
