#!/bin/sh
set -eu
# Database schema and seed data are initialized by MySQL scripts in
# /docker-entrypoint-initdb.d. Django must not migrate or import seed data
# during application startup.
python manage.py collectstatic --noinput
if [ "${DJANGO_DEBUG:-false}" = "true" ]; then
  exec python manage.py runserver 0.0.0.0:8000
fi
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers "${GUNICORN_WORKERS:-3}" --timeout 120
