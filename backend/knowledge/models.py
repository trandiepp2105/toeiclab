"""Curated grammar notes and TOEIC strategies."""
from django.db import models
class GrammarNote(models.Model):
    title=models.CharField(max_length=240); body=models.TextField(); quick_rule=models.TextField(blank=True); example=models.TextField(blank=True)
    sort_order=models.PositiveIntegerField(default=0); is_published=models.BooleanField(default=True)
    class Meta: ordering=['sort_order','title']
class PartTip(models.Model):
    part_number=models.PositiveSmallIntegerField(); title=models.CharField(max_length=240); body=models.TextField(); sort_order=models.PositiveIntegerField(default=0); is_published=models.BooleanField(default=True)
    class Meta: ordering=['part_number','sort_order']
class KnowledgeArticle(models.Model):
    title=models.CharField(max_length=240); url=models.URLField(); source_name=models.CharField(max_length=140,blank=True); sort_order=models.PositiveIntegerField(default=0); is_published=models.BooleanField(default=True)
    class Meta: ordering=['sort_order','title']
