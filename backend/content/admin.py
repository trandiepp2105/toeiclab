from django.contrib import admin
from .models import Exam,ExamPart,Passage,Question,QuestionOption,ContentAsset,QuestionAsset,PassageAsset
admin.site.register([Exam,ExamPart,Passage,Question,QuestionOption,ContentAsset,QuestionAsset,PassageAsset])
