from django.contrib import admin
from .models import VocabularyTopic,VocabularyTerm,TopicTerm,TermAsset
admin.site.register([VocabularyTopic,VocabularyTerm,TopicTerm,TermAsset])
