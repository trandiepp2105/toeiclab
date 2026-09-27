"""Vocabulary memory status and saved quiz attempts."""
from django.conf import settings
from django.db import models
from vocabulary.models import VocabularyTerm, VocabularyTopic
from content.models import Question

class VocabularyProgress(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='vocabulary_progress'); term=models.ForeignKey(VocabularyTerm,on_delete=models.CASCADE,related_name='progress_records')
    status=models.CharField(max_length=16,default='learning'); seen_count=models.PositiveIntegerField(default=0); correct_count=models.PositiveIntegerField(default=0); wrong_count=models.PositiveIntegerField(default=0)
    last_seen_at=models.DateTimeField(null=True,blank=True); learned_at=models.DateTimeField(null=True,blank=True); next_review_at=models.DateTimeField(null=True,blank=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['user','term'],name='unique_user_term_progress')]

class VocabularyQuizAttempt(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='vocabulary_quizzes'); scope=models.CharField(max_length=16)
    topic=models.ForeignKey(VocabularyTopic,null=True,blank=True,on_delete=models.SET_NULL); question_type=models.CharField(max_length=16,default='mixed')
    question_count=models.PositiveSmallIntegerField(); correct_count=models.PositiveSmallIntegerField(default=0); status=models.CharField(max_length=16,default='in_progress')
    started_at=models.DateTimeField(auto_now_add=True); submitted_at=models.DateTimeField(null=True,blank=True)

class VocabularyQuizAnswer(models.Model):
    attempt=models.ForeignKey(VocabularyQuizAttempt,on_delete=models.CASCADE,related_name='answers'); term=models.ForeignKey(VocabularyTerm,on_delete=models.PROTECT)
    prompt_type=models.CharField(max_length=16); options_json=models.JSONField(default=list); correct_value=models.TextField(); selected_value=models.TextField(blank=True)
    is_correct=models.BooleanField(null=True); answered_at=models.DateTimeField(null=True,blank=True); position=models.PositiveSmallIntegerField()
    class Meta: constraints=[models.UniqueConstraint(fields=['attempt','position'],name='unique_quiz_position')]; ordering=['position']


class PartPracticeProgress(models.Model):
    """Stores the next question group to resume for one user and Part."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='part_practice_progress')
    part_number = models.PositiveSmallIntegerField()
    last_question = models.ForeignKey(Question, null=True, blank=True, on_delete=models.SET_NULL, related_name='practice_progress')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'part_number'], name='unique_user_part_practice_progress')]
