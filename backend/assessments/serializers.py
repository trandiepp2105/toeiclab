"""Validated write contracts for assessment attempts."""
from rest_framework import serializers

class StartAttemptSerializer(serializers.Serializer):
    exam_id=serializers.CharField(max_length=80)
    mode=serializers.ChoiceField(choices=['full','part','subset'],default='full')
    selected_parts=serializers.ListField(child=serializers.IntegerField(min_value=1,max_value=7),required=False,default=list)
    time_limit_seconds=serializers.IntegerField(min_value=300,max_value=7200,required=False,allow_null=True)

class SaveAnswersSerializer(serializers.Serializer):
    answers=serializers.DictField(child=serializers.ChoiceField(choices=list('ABCD')))
    check=serializers.BooleanField(required=False,default=False)


class AttemptProgressSerializer(serializers.Serializer):
    """Validate the current zero-based question position for a full test."""

    current_question_index = serializers.IntegerField(min_value=0)
