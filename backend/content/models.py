"""Normalized exam bank and local media references."""
from django.db import models

class Exam(models.Model):
    external_id = models.CharField(max_length=80, unique=True); title = models.CharField(max_length=255)
    provider = models.CharField(max_length=40, default='Zenlish'); source_url = models.URLField(blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    slug = models.SlugField(max_length=180, unique=True)
    time_limit_seconds = models.PositiveIntegerField(default=7200); question_count = models.PositiveIntegerField(default=0)
    answer_count = models.PositiveIntegerField(default=0); status = models.CharField(max_length=20, default='published')
    source_payload = models.JSONField(default=dict, blank=True); created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title

class ExamPart(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='parts'); part_number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=120); question_count = models.PositiveIntegerField(default=0)
    class Meta: ordering=['part_number']; constraints=[models.UniqueConstraint(fields=['exam','part_number'],name='unique_exam_part')]

class Direction(models.Model):
    """Reading instructions and optional example media for a TOEIC Part."""
    part_number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=120)
    direction_html = models.TextField(blank=True)
    image_path = models.CharField(max_length=600, blank=True)
    example_html = models.TextField(blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'part_number']
        db_table = 'directions'

    def __str__(self):
        return f'Part {self.part_number} directions'

class Passage(models.Model):
    exam_part = models.ForeignKey(ExamPart, on_delete=models.CASCADE, related_name='passages')
    source_key = models.CharField(max_length=180); content_html = models.TextField(blank=True); transcript = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0); assets = models.JSONField(default=list, blank=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['exam_part','source_key'],name='unique_passage_key')]; ordering=['sort_order']

class Question(models.Model):
    exam_part = models.ForeignKey(ExamPart,on_delete=models.CASCADE,related_name='questions'); passage = models.ForeignKey(Passage,null=True,blank=True,on_delete=models.SET_NULL,related_name='questions')
    external_question_id = models.CharField(max_length=80,blank=True); number = models.PositiveSmallIntegerField(); title = models.CharField(max_length=255,blank=True)
    prompt = models.TextField(blank=True); prompt_html = models.TextField(blank=True); correct_option = models.CharField(max_length=1,null=True,blank=True)
    explanation_reason = models.TextField(blank=True); explanation_tip = models.TextField(blank=True); transcript = models.TextField(blank=True)
    transcript_source = models.CharField(max_length=100,blank=True); media = models.JSONField(default=dict,blank=True); source_payload = models.JSONField(default=dict,blank=True)
    class Meta: ordering=['number']; constraints=[models.UniqueConstraint(fields=['exam_part','number'],name='unique_part_question')]

class QuestionOption(models.Model):
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name='options'); option_key = models.CharField(max_length=1); answer_text = models.TextField(blank=True)
    class Meta: ordering=['option_key']; constraints=[models.UniqueConstraint(fields=['question','option_key'],name='unique_question_option')]

class ContentAsset(models.Model):
    asset_type = models.CharField(max_length=20); storage_path = models.CharField(max_length=600,blank=True); source_url = models.URLField(max_length=1000,blank=True)
    mime_type = models.CharField(max_length=100,blank=True); duration_seconds = models.FloatField(null=True,blank=True); metadata = models.JSONField(default=dict,blank=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['asset_type','storage_path'],name='unique_content_asset_path')]

class QuestionAsset(models.Model):
    question=models.ForeignKey(Question,on_delete=models.CASCADE,related_name='asset_links'); asset=models.ForeignKey(ContentAsset,on_delete=models.PROTECT,related_name='question_links')
    sort_order=models.PositiveIntegerField(default=0); role=models.CharField(max_length=32,default='question')
    class Meta: constraints=[models.UniqueConstraint(fields=['question','asset','role'],name='unique_question_asset_role')]; ordering=['sort_order']

class PassageAsset(models.Model):
    passage=models.ForeignKey(Passage,on_delete=models.CASCADE,related_name='asset_links'); asset=models.ForeignKey(ContentAsset,on_delete=models.PROTECT,related_name='passage_links')
    sort_order=models.PositiveIntegerField(default=0); role=models.CharField(max_length=32,default='passage')
    class Meta: constraints=[models.UniqueConstraint(fields=['passage','asset','role'],name='unique_passage_asset_role')]; ordering=['sort_order']
