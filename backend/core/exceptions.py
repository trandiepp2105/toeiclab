"""DRF exception logging for unexpected server-side API failures."""
import logging

from rest_framework.views import exception_handler

from core.observability import log_event

logger = logging.getLogger('toeiclab.api')


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None or response.status_code >= 500:
        request = context.get('request')
        log_event(
            logger, logging.ERROR, 'unhandled_api_exception', exc_info=(type(exc), exc, exc.__traceback__),
            method=getattr(request, 'method', None),
            endpoint=getattr(getattr(request, 'resolver_match', None), 'route', '')[:160],
            status_code=500 if response is None else response.status_code,
            error_code='unhandled_exception',
            user_id=getattr(getattr(request, 'user', None), 'pk', None),
        )
    return response
