# Application logging

Application logs are JSON lines written to stdout, so Docker can collect them. Production defaults to `INFO`; development uses `DEBUG`. `API_SLOW_REQUEST_MS` controls the slow API threshold (default: 1000 ms). The request middleware logs only failed or slow requests; Nginx emits the access log for all requests to stdout and its errors to stderr. Nginx reports `duration_seconds`; Django uses `duration_ms`.

Every request receives a validated `X-Request-ID`, returned in the response. A supplied ID must match `[A-Za-z0-9._:-]{1,64}`; otherwise the server generates a UUID. The ID is included in request and business event logs.

## Event catalog

| Event | Purpose | Allowed identifying/context data |
| --- | --- | --- |
| `api_request_failed` | API returned 4xx/5xx | method, resolved route, status, duration, request ID, user ID |
| `api_request_slow` | API exceeded configured threshold | method, resolved route, status, duration, request ID, user ID |
| `unhandled_request_exception`, `unhandled_api_exception` | Unhandled server error with traceback | method, resolved route, status, request ID, user ID, exception stack |
| `login_succeeded`, `login_failed`, `google_sign_in_succeeded`, `google_sign_in_failed` | Authentication outcome | user ID on success; stable error code on failure |
| `otp_sent`, `otp_send_failed`, `otp_delivery_failed`, `otp_verification_failed` | OTP lifecycle | stable error code; user ID only where already known |
| `refresh_token_succeeded`, `refresh_token_failed`, `password_changed`, `password_change_failed`, `password_reset_*`, `registration_completed` | Credential lifecycle | user ID where available; stable error code |
| `test_attempt_created`, `test_attempt_started`, `test_attempt_submitted`, `test_attempt_abandoned` | Assessment lifecycle | user ID and attempt ID |
| `test_attempt_progress_save_failed`, `test_attempt_answers_save_failed`, `test_attempt_submission_failed`, `test_attempt_creation_failed` | Assessment failures | user ID, attempt ID if known, stable error code |
| `part_answer_check_failed` | Part-practice answer validation/persistence failure | user ID, fixed part/error code where known |
| `vocabulary_quiz_created`, `vocabulary_quiz_submitted` | Quiz lifecycle | user ID and quiz ID |
| `vocabulary_quiz_creation_failed`, `vocabulary_quiz_answer_failed`, `vocabulary_quiz_submission_failed` | Quiz failures | user ID, quiz ID if known, stable error code |
| `content_import_file_failed`, `content_import_completed` | Import outcome summary | import operation and processed/succeeded/failed counts |

Log fields are allowlisted in `core.observability`. Do not add request/response bodies, email addresses, passwords, OTPs, JWTs, cookies, Google credentials, answer choices, or learning content. Database exceptions are emitted by the unhandled error path; SQL query logging is disabled. New event names should be added to this catalog.
