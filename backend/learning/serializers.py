"""Validated request payloads for bilingual vocabulary quizzes."""
from rest_framework import serializers

class CreateQuizSerializer(serializers.Serializer):
    scope=serializers.ChoiceField(choices=['all','topic','review'],default='all')
    topic_id=serializers.IntegerField(required=False,allow_null=True)
    question_count=serializers.ChoiceField(choices=[10,20,30],default=10)
    question_types=serializers.ListField(child=serializers.ChoiceField(choices=['vi_to_en','en_to_vi']),required=False,default=lambda:['vi_to_en','en_to_vi'],allow_empty=False)
    def validate(self,attrs):
        if attrs['scope']=='topic' and not attrs.get('topic_id'):raise serializers.ValidationError({'topic_id':'Chọn một chủ đề.'})
        return attrs

class AnswerQuizSerializer(serializers.Serializer):
    position=serializers.IntegerField(min_value=1)
    selected_value=serializers.CharField(max_length=300)
