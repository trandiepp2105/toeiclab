"""Structured application logging and request correlation helpers."""
import json
import logging
import re
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone


_REQUEST_ID = ContextVar('request_id', default=None)
_VALID_REQUEST_ID = re.compile(r'^[A-Za-z0-9._:-]{1,64}$')
_SAFE_FIELDS = {
    'service', 'request_id', 'user_id', 'resource_id', 'duration_ms',
    'status_code', 'error_code', 'method', 'endpoint', 'operation',
    'processed_count', 'succeeded_count', 'failed_count', 'part_number',
}


def request_id_from_header(value):
    """Accept only short, printable request IDs; generate one for all other values."""
    if isinstance(value, str) and _VALID_REQUEST_ID.fullmatch(value):
        return value
    return uuid.uuid4().hex


def current_request_id():
    return _REQUEST_ID.get()


def log_event(logger, level, event, *, exc_info=None, **fields):
    """Emit a stable event and a strict allowlist of non-sensitive fields."""
    safe = {key: value for key, value in fields.items() if key in _SAFE_FIELDS and value is not None}
    safe.setdefault('request_id', current_request_id())
    safe.setdefault('service', 'toeiclab-api')
    logger.log(level, event, extra={'event': event, **safe}, exc_info=exc_info)


class JsonLogFormatter(logging.Formatter):
    """Serialize approved LogRecord attributes as one JSON object per line."""
    def format(self, record):
        payload = {
            'timestamp': datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            'level': record.levelname,
            'event': getattr(record, 'event', 'application_log'),
            'service': getattr(record, 'service', 'toeiclab-api'),
        }
        for field in _SAFE_FIELDS - {'service', 'request_id'}:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        request_id = getattr(record, 'request_id', None)
        if request_id:
            payload['request_id'] = request_id
        if record.exc_info:
            payload['exception'] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)
