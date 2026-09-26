# MySQL initialization

MySQL initializes the TOEIC Lab database by executing the files in this
directory in lexical order. The application container does not run Django
migrations or a Python data importer during startup.

| File | Purpose |
| --- | --- |
| `00-create-database.sql` | Sets the connection character set and timezone. The official MySQL image creates the database and user from `MYSQL_*`. |
| `01-schema.sql` | Creates the Django, user, content, vocabulary, learning, assessment and knowledge tables. |
| `02-framework-data.sql` | Seeds Django content types and permissions. |
| `03-content-data.sql` | Imports normalized exams, parts, passages, questions, options and media references. |
| `04-vocabulary-data.sql` | Imports vocabulary topics, terms, topic links and term media references. |
| `05-knowledge-data.sql` | Imports grammar notes, part tips and knowledge articles. |

The data files are SQL exports of the normalized records. They are consumed
directly by the MySQL image; the backend only serves the resulting records.
Project migration Python files have been removed. `backend/core/settings.py`
marks these domain apps as unmigrated so Django does not try to recreate or
alter the MySQL-owned schema.

These scripts run automatically only when the MySQL data volume is created
for the first time. For a new environment, run:

```bash
docker compose -f docker/docker-compose.dev.yml up --build -d
```

For an existing volume, do not delete production data. Apply a new SQL file
explicitly after reviewing it, or create a fresh development volume to test
the complete initialization sequence.
