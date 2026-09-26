"""Read serializers for grammar and strategy content."""
from rest_framework import serializers
from .models import GrammarNote,PartTip,KnowledgeArticle

class GrammarNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model=GrammarNote;fields=['id','title','body','quick_rule','example'];read_only_fields=fields
class PartTipSerializer(serializers.ModelSerializer):
    class Meta:
        model=PartTip;fields=['id','part_number','title','body'];read_only_fields=fields
class KnowledgeArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model=KnowledgeArticle;fields=['id','title','url','source_name'];read_only_fields=fields
