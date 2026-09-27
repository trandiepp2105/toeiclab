"""Idempotently import local TOEIC tests and vocabulary topics."""
from pathlib import Path
import logging
from django.core.management.base import BaseCommand, CommandError
from content.services import import_exam_file
from vocabulary.services import import_topic_file
from core.observability import log_event

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help='Import local test and vocabulary JSON files without deleting existing records.'
    def add_arguments(self, parser):
        parser.add_argument('--tests',default='/app/mysql/seed/zenlish_data')
        parser.add_argument('--vocabulary',default='/app/mysql/seed/vocab/topics')
    def handle(self,*args,**opts):
        tests=sorted(Path(opts['tests']).glob('*/test.json'),key=lambda p:int(p.parent.name) if p.parent.name.isdigit() else p.parent.name)
        topics=sorted(Path(opts['vocabulary']).glob('*.json')); errors=[]; succeeded=0
        for path in tests:
            try:
                import_exam_file(path)
                succeeded += 1
            except Exception as exc:
                errors.append((path, type(exc).__name__))
                log_event(logger, logging.ERROR, 'content_import_file_failed', service='content_import', operation='exam_import', error_code='import_failed')
        for path in topics:
            try:
                import_topic_file(path)
                succeeded += 1
            except Exception as exc:
                errors.append((path, type(exc).__name__))
                log_event(logger, logging.ERROR, 'content_import_file_failed', service='content_import', operation='vocabulary_import', error_code='import_failed')
        failed = len(errors)
        log_event(logger, logging.INFO if not failed else logging.WARNING, 'content_import_completed', service='content_import', processed_count=len(tests) + len(topics), succeeded_count=succeeded, failed_count=failed)
        self.stdout.write(self.style.SUCCESS(f'Processed {len(tests)} tests and {len(topics)} vocabulary topics.'))
        if errors:
            for path,error_name in errors[:30]: self.stderr.write(f'{path.name}: import failed ({error_name}).')
            raise CommandError(f'{len(errors)} source file(s) failed; successfully imported records were preserved.')
