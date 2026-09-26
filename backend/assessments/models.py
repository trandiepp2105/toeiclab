"""Persist test sessions, answers and per-part results."""
import uuid
from django.conf import settings
from django.db import models
from content.models import Exam, ExamPart, Question

class TestAttempt(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False); user=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.SET_NULL,related_name='test_attempts')
    exam=models.ForeignKey(Exam,on_delete=models.PROTECT); mode=models.CharField(max_length=12,default='full'); status=models.CharField(max_length=16,default='in_progress')
    time_limit_seconds=models.PositiveIntegerField(null=True,blank=True); started_at=models.DateTimeField(auto_now_add=True); exam_started_at=models.DateTimeField(null=True,blank=True); submitted_at=models.DateTimeField(null=True,blank=True); last_activity_at=models.DateTimeField(auto_now=True); current_question_index=models.PositiveIntegerField(default=0)

class AttemptPart(models.Model):
    attempt=models.ForeignKey(TestAttempt,on_delete=models.CASCADE,related_name='selected_parts'); exam_part=models.ForeignKey(ExamPart,on_delete=models.PROTECT); position=models.PositiveSmallIntegerField()
    class Meta: constraints=[models.UniqueConstraint(fields=['attempt','exam_part'],name='unique_attempt_part')]; ordering=['position']

class TestAnswer(models.Model):
    attempt=models.ForeignKey(TestAttempt,on_delete=models.CASCADE,related_name='answers'); question=models.ForeignKey(Question,on_delete=models.PROTECT)
    selected_option=models.CharField(max_length=1,blank=True); is_correct=models.BooleanField(null=True); answered_at=models.DateTimeField(null=True,blank=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['attempt','question'],name='unique_attempt_question')]

class PartScore(models.Model):
    attempt=models.ForeignKey(TestAttempt,on_delete=models.CASCADE,related_name='part_scores'); exam_part=models.ForeignKey(ExamPart,on_delete=models.PROTECT)
    answered_count=models.PositiveIntegerField(default=0); scored_count=models.PositiveIntegerField(default=0); correct_count=models.PositiveIntegerField(default=0); score_percent=models.FloatField(default=0)
    class Meta: constraints=[models.UniqueConstraint(fields=['attempt','exam_part'],name='unique_attempt_part_score')]
