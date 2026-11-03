# TOEIC Lab Admin

The administration console is a standalone React application. It has its own
entry point, sign-in screen, token cookies, styles, and Docker build, while
using the backend's staff-only API at `/api/v1/admin/`.

With the development Compose stack running, open <http://127.0.0.1/manage/>.
The learning application remains at <http://127.0.0.1/> and does not link to or
render admin screens.

To run it outside Compose, install this directory's dependencies and start the
CRA server with `PUBLIC_URL=/manage` and `REACT_APP_API_BASE_URL=/api/v1`; route
`/manage/` to that server and `/api/` to the backend.
