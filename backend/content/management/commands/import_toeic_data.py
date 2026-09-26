"""Idempotently import local TOEIC tests and vocabulary topics."""
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from content.services import import_exam_file
from vocabulary.services import import_topic_file

class Command(BaseCommand):
    help='Import local test and vocabulary JSON files without deleting existing records.'
    def add_arguments(self, parser):
        parser.add_argument('--tests',default='/app/mysql/seed/zenlish_data')
        parser.add_argument('--vocabulary',default='/app/mysql/seed/vocab/topics')
    def handle(self,*args,**opts):
        tests=sorted(Path(opts['tests']).glob('*/test.json'),key=lambda p:int(p.parent.name) if p.parent.name.isdigit() else p.parent.name)
        topics=sorted(Path(opts['vocabulary']).glob('*.json')); errors=[]
        for path in tests:
            try: import_exam_file(path)
            except Exception as exc: errors.append((path,str(exc)))
        for path in topics:
            try: import_topic_file(path)
            except Exception as exc: errors.append((path,str(exc)))
        self.stdout.write(self.style.SUCCESS(f'Processed {len(tests)} tests and {len(topics)} vocabulary topics.'))
        if errors:
            for path,error in errors[:30]: self.stderr.write(f'{path}: {error}')
            raise CommandError(f'{len(errors)} source file(s) failed; successfully imported records were preserved.')
