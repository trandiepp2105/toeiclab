from django.contrib import admin
from .models import VocabularyProgress,VocabularyQuizAttempt,VocabularyQuizAnswer
admin.site.register([VocabularyProgress,VocabularyQuizAttempt,VocabularyQuizAnswer])
