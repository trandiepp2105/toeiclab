from django.contrib import admin
from .models import TestAttempt,AttemptPart,TestAnswer,PartScore
admin.site.register([TestAttempt,AttemptPart,TestAnswer,PartScore])
