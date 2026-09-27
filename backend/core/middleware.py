"""Request ID propagation and low-noise HTTP failure/latency logging."""
import logging
import time

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

from core.observability import _REQUEST_ID, log_event, request_id_from_header

logger = logging.getLogger('toeiclab.http')


class RequestObservabilityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.request_id = request_id_from_header(request.META.get('HTTP_X_REQUEST_ID'))
        request._request_id_token = _REQUEST_ID.set(request.request_id)
        request._request_started_at = time.monotonic()

    def process_response(self, request, response):
        request_id = getattr(request, 'request_id', None)
        if request_id:
            response['X-Request-ID'] = request_id
            duration_ms = round((time.monotonic() - request._request_started_at) * 1000, 2)
            status = response.status_code
            fields = {
                'request_id': request_id,
                'method': request.method,
                'endpoint': getattr(getattr(request, 'resolver_match', None), 'route', '')[:160],
                'status_code': status,
                'duration_ms': duration_ms,
                'user_id': getattr(getattr(request, 'user', None), 'pk', None),
            }
            if status >= 500:
                log_event(logger, logging.ERROR, 'api_request_failed', error_code='http_5xx', **fields)
            elif status >= 400:
                log_event(logger, logging.WARNING, 'api_request_failed', error_code='http_4xx', **fields)
            threshold = getattr(settings, 'API_SLOW_REQUEST_MS', 1000)
            if duration_ms >= threshold:
                log_event(logger, logging.WARNING, 'api_request_slow', **fields)
            token = getattr(request, '_request_id_token', None)
            if token is not None:
                _REQUEST_ID.reset(token)
        return response

    def process_exception(self, request, exception):
        log_event(
            logger, logging.ERROR, 'unhandled_request_exception', exc_info=True,
            method=request.method,
            endpoint=getattr(getattr(request, 'resolver_match', None), 'route', '')[:160],
            status_code=500, error_code='unhandled_exception',
            user_id=getattr(getattr(request, 'user', None), 'pk', None),
        )
        return None
