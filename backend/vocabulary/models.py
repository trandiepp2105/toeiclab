"""Vocabulary topics, terms, and media metadata."""
from django.db import models

class VocabularyTopic(models.Model):
    slug=models.SlugField(unique=True); name=models.CharField(max_length=160); description=models.TextField(blank=True)
    source_url=models.URLField(blank=True); sort_order=models.PositiveIntegerField(default=0); is_published=models.BooleanField(default=True)
    class Meta: ordering=['sort_order','name']

class VocabularyTerm(models.Model):
    word=models.CharField(max_length=180,db_index=True); level=models.CharField(max_length=12,blank=True); part_of_speech=models.CharField(max_length=40,blank=True)
    pronunciation=models.CharField(max_length=180,blank=True); meaning_vi=models.TextField(blank=True); example_en=models.TextField(blank=True); is_active=models.BooleanField(default=True)
    class Meta: ordering=['word']

class TopicTerm(models.Model):
    topic=models.ForeignKey(VocabularyTopic,on_delete=models.CASCADE,related_name='topic_terms'); term=models.ForeignKey(VocabularyTerm,on_delete=models.CASCADE,related_name='topic_terms')
    sort_order=models.PositiveIntegerField(default=0)
    class Meta: ordering=['sort_order']; constraints=[models.UniqueConstraint(fields=['topic','term'],name='unique_topic_term'),models.UniqueConstraint(fields=['topic','sort_order'],name='unique_topic_term_order')]

class TermAsset(models.Model):
    term=models.ForeignKey(VocabularyTerm,on_delete=models.CASCADE,related_name='assets'); asset_role=models.CharField(max_length=24)
    storage_path=models.CharField(max_length=600,blank=True); source_url=models.URLField(max_length=1000,blank=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['term','asset_role'],name='unique_term_asset_role')]
