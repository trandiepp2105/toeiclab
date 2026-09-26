"""Read serializers for vocabulary topic and term records."""
from rest_framework import serializers
from .models import VocabularyTopic,VocabularyTerm

class VocabularyTermSerializer(serializers.ModelSerializer):
    class Meta:
        model=VocabularyTerm
        fields=['id','word','level','part_of_speech','pronunciation','meaning_vi','example_en','is_active']
        read_only_fields=fields

class VocabularyTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model=VocabularyTopic
        fields=['id','slug','name','description','source_url','sort_order','is_published']
        read_only_fields=fields
