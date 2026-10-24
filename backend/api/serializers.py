"""Validation for API query parameters and small request payloads."""
from rest_framework import serializers


class ExamListQuerySerializer(serializers.Serializer):
    answers = serializers.ChoiceField(
        choices=('complete', 'incomplete'), required=False,
    )
    q = serializers.CharField(required=False, allow_blank=True, max_length=120)
    year = serializers.IntegerField(required=False, allow_null=True)
    page = serializers.IntegerField(min_value=1, required=False, default=1)
    page_size = serializers.IntegerField(
        min_value=1, max_value=200, required=False, default=100,
    )


class AttemptQuerySerializer(serializers.Serializer):
    attempt = serializers.UUIDField(required=False)


class PracticeQuestionsQuerySerializer(serializers.Serializer):
    direction = serializers.ChoiceField(
        choices=('around', 'next', 'previous', 'first'),
        required=False,
        default='around',
    )
    cursor = serializers.IntegerField(min_value=1, required=False)


class TermListQuerySerializer(serializers.Serializer):
    topic = serializers.IntegerField(min_value=1, required=False)
    q = serializers.CharField(required=False, allow_blank=True, max_length=100)


class PracticeProgressSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(min_value=1)
