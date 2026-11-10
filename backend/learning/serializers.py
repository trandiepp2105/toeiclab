"""Validate vocabulary quiz creation and answer payloads."""

from rest_framework import serializers


class CreateQuizSerializer(serializers.Serializer):
    scope = serializers.ChoiceField(
        choices=["all", "topic", "review"],
        default="all",
    )
    topic_id = serializers.IntegerField(required=False, allow_null=True)
    question_count = serializers.IntegerField(
        min_value=1,
        required=False,
        default=10,
    )
    question_types = serializers.ListField(
        child=serializers.ChoiceField(choices=["vi_to_en", "en_to_vi"]),
        required=False,
        default=lambda: ["vi_to_en", "en_to_vi"],
        allow_empty=False,
    )

    def validate(self, attrs):
        if attrs["scope"] == "topic" and not attrs.get("topic_id"):
            raise serializers.ValidationError(
                {"topic_id": "Chọn một chủ đề."}
            )
        if attrs["scope"] != "topic" and attrs["question_count"] not in (
            10,
            20,
            30,
        ):
            raise serializers.ValidationError(
                {"question_count": "Số câu chỉ có thể là 10, 20 hoặc 30."}
            )
        return attrs


class AnswerQuizSerializer(serializers.Serializer):
    position = serializers.IntegerField(min_value=1)
    selected_value = serializers.CharField(max_length=300)
