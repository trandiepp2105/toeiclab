"""Initialize a fresh TOEIC Lab MySQL database from the repository SQL files."""

import os
import shutil
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    """Load the versioned schema and seed data into an empty MySQL database."""

    help = "Load the repository's SQL schema and seed data into a fresh MySQL database."
    marker_table = "toeiclab_bootstrap_state"

    def handle(self, *args, **options):
        mysql = shutil.which("mysql")
        if not mysql:
            raise CommandError("The mysql client is required to bootstrap this database.")

        database = connection.settings_dict["NAME"]
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s", [database, self.marker_table])
            marker_exists = cursor.fetchone()[0] > 0
            if marker_exists:
                cursor.execute(f"SELECT completed FROM `{self.marker_table}` ORDER BY id DESC LIMIT 1")
                state = cursor.fetchone()
                if state and state[0]:
                    self.stdout.write("TOEIC Lab database bootstrap is already complete.")
                    return
                raise CommandError("A previous database bootstrap did not complete. Inspect the database before retrying.")

            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s", [database])
            if cursor.fetchone()[0]:
                raise CommandError("The target database is not empty and has no bootstrap marker; refusing to import schema SQL.")

            cursor.execute(f"CREATE TABLE `{self.marker_table}` (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, completed BOOLEAN NOT NULL DEFAULT FALSE)")
            cursor.execute(f"INSERT INTO `{self.marker_table}` (completed) VALUES (FALSE)")
            marker_id = cursor.lastrowid

        sql_directory = Path(__file__).resolve().parents[3] / "bootstrap" / "sql"
        sql_files = sorted(sql_directory.glob("*.sql"))
        if not sql_files:
            raise CommandError(f"No SQL bootstrap files found in {sql_directory}.")

        settings = connection.settings_dict
        env = os.environ.copy()
        env["MYSQL_PWD"] = settings["PASSWORD"]
        args = [mysql, f"--host={settings['HOST']}", f"--port={settings['PORT'] or 3306}", f"--user={settings['USER']}", f"--database={database}", "--default-character-set=utf8mb4", "--binary-mode=1"]

        for sql_file in sql_files:
            self.stdout.write(f"Loading {sql_file.name}...")
            try:
                with sql_file.open("rb") as sql_input:
                    subprocess.run(args, stdin=sql_input, env=env, check=True)
            except (OSError, subprocess.CalledProcessError) as exc:
                raise CommandError(f"Could not load {sql_file.name}; database bootstrap is incomplete.") from exc

        with connection.cursor() as cursor:
            cursor.execute(f"UPDATE `{self.marker_table}` SET completed = TRUE WHERE id = %s", [marker_id])
        self.stdout.write(self.style.SUCCESS("TOEIC Lab database bootstrap completed."))
