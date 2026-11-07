"""Idempotently import local TOEIC tests and vocabulary topics."""

import logging
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from core.observability import log_event
from content.services import import_exam_file
from vocabulary.services import import_topic_file


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import local test and vocabulary JSON files without deleting existing records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tests",
            default="/app/mysql/seed/zenlish_data",
        )
        parser.add_argument(
            "--vocabulary",
            default="/app/mysql/seed/vocab/topics",
        )

    def handle(self, *args, **options):
        test_files = sorted(
            Path(options["tests"]).glob("*/test.json"),
            key=lambda path: (
                int(path.parent.name)
                if path.parent.name.isdigit()
                else path.parent.name
            ),
        )
        topic_files = sorted(Path(options["vocabulary"]).glob("*.json"))
        errors = []
        succeeded = 0

        import_groups = (
            (test_files, import_exam_file, "exam_import"),
            (topic_files, import_topic_file, "vocabulary_import"),
        )
        for paths, importer, operation in import_groups:
            for path in paths:
                try:
                    importer(path)
                    succeeded += 1
                except Exception as exc:
                    errors.append((path, type(exc).__name__))
                    log_event(
                        logger,
                        logging.ERROR,
                        "content_import_file_failed",
                        service="content_import",
                        operation=operation,
                        error_code="import_failed",
                    )

        failed = len(errors)
        log_event(
            logger,
            logging.INFO if not failed else logging.WARNING,
            "content_import_completed",
            service="content_import",
            processed_count=len(test_files) + len(topic_files),
            succeeded_count=succeeded,
            failed_count=failed,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {len(test_files)} tests and "
                f"{len(topic_files)} vocabulary topics."
            )
        )

        if errors:
            for path, error_name in errors[:30]:
                self.stderr.write(
                    f"{path.name}: import failed ({error_name})."
                )
            raise CommandError(
                f"{len(errors)} source file(s) failed; successfully imported "
                "records were preserved."
            )
