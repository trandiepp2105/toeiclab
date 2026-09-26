"""Read serializers for the normalized exam bank."""
from rest_framework import serializers
from .models import Exam,ExamPart,Question,QuestionOption

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model=QuestionOption
        fields=['option_key','answer_text']
        read_only_fields=fields

class QuestionSerializer(serializers.ModelSerializer):
    options=QuestionOptionSerializer(many=True,read_only=True)
    class Meta:
        model=Question
        fields=['id','number','title','prompt','prompt_html','correct_option','explanation_reason','explanation_tip','transcript','transcript_source','options']
        read_only_fields=fields

class ExamPartSerializer(serializers.ModelSerializer):
    class Meta:
        model=ExamPart
        fields=['part_number','title','question_count']
        read_only_fields=fields

class ExamSerializer(serializers.ModelSerializer):
    parts=ExamPartSerializer(many=True,read_only=True)
    class Meta:
        model=Exam
        fields=['external_id','slug','title','provider','source_url','year','time_limit_seconds','question_count','answer_count','status','parts']
        read_only_fields=fields


class PracticeCheckSerializer(serializers.Serializer):
    """Validate one or more answers submitted by the part-practice UI."""

    answers = serializers.DictField(
        child=serializers.ChoiceField(choices=list('ABCD')),
        allow_empty=False,
    )
