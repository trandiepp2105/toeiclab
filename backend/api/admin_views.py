"""Admin-only content and account management API."""
from django.contrib.auth import get_user_model
from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, Max, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import serializers

from assessments.models import TestAttempt
from learning.models import VocabularyProgress, VocabularyQuizAttempt
from learning.services import calculate_study_streak
from content.models import Exam, Question, QuestionOption
from knowledge.models import GrammarNote, PartTip
from vocabulary.models import TopicTerm, VocabularyTerm, VocabularyTopic
from users.models import AdminPermission, Role, UserRole
from .permissions import HasAdminPermission
from .views import dashboard_summary_data

User = get_user_model()
def page_payload(queryset, request, serializer):
    """Return a bounded page and standard pagination metadata for admin tables."""
    try:
        page_number = max(1, int(request.query_params.get("page", 1)))
        page_size = min(100, max(1, int(request.query_params.get("page_size", 25))))
    except (TypeError, ValueError):
        return None, Response({"error": "Trang hoặc kích thước trang không hợp lệ."}, status=400)

    paginator = Paginator(queryset, page_size)
    try:
        page = paginator.page(page_number)
    except EmptyPage:
        page = paginator.page(paginator.num_pages or 1)
    return {
        "count": paginator.count,
        "page": page.number,
        "page_size": page_size,
        "pages": paginator.num_pages,
        "results": serializer(page.object_list, many=True).data,
    }, None


class AdminUserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField(read_only=True)
    providers = serializers.SerializerMethodField()
    password_enabled = serializers.SerializerMethodField()
    attempt_count = serializers.IntegerField(read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "display_name", "email_verified", "is_active",
            "is_staff", "date_joined", "last_login", "providers", "password_enabled", "attempt_count", "roles",
        )

    def get_providers(self, user):
        return list(user.identities.order_by("provider").values_list("provider", flat=True))

    def get_password_enabled(self, user):
        return user.has_usable_password()

    def get_roles(self, user):
        return [
            {"id": role.id, "code": role.code, "name": role.name}
            for role in user.roles.order_by("name", "id")
        ]


class AdminUserUpdateSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(required=True)


class UserRoleUpdateSerializer(serializers.Serializer):
    """Validate a complete replacement list for a user's assigned roles."""

    role_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
        max_length=50,
    )

    def validate_role_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Không được chọn trùng vai trò.")
        roles = list(Role.objects.filter(pk__in=value).prefetch_related("permissions"))
        if len(roles) != len(value):
            raise serializers.ValidationError("Một hoặc nhiều vai trò không tồn tại.")

        request = self.context["request"]
        if not request.user.is_superuser:
            caller_codes = request.user.get_admin_permission_codes()
            for role in roles:
                role_codes = set(role.permissions.values_list("code", flat=True))
                if not role_codes.issubset(caller_codes):
                    raise serializers.ValidationError(
                        "Bạn không thể gán vai trò có quyền vượt quá quyền của mình."
                    )
        self.context["roles"] = roles
        return value


class RoleInputSerializer(serializers.Serializer):
    """Validate role metadata and its explicit list of capability codes."""

    code = serializers.RegexField(r"^[a-z][a-z0-9_-]{1,63}$", required=False)
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(required=False, allow_blank=True)
    permission_codes = serializers.ListField(
        child=serializers.CharField(max_length=80),
        required=False,
        allow_empty=True,
        max_length=100,
    )

    def validate_code(self, value):
        queryset = Role.objects.filter(code=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Mã vai trò đã được sử dụng.")
        return value

    def validate_permission_codes(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Không được chọn trùng quyền.")
        known_codes = set(AdminPermission.objects.filter(code__in=value).values_list("code", flat=True))
        unknown_codes = sorted(set(value) - known_codes)
        if unknown_codes:
            raise serializers.ValidationError(f"Quyền không tồn tại: {', '.join(unknown_codes)}")
        request = self.context["request"]
        if not request.user.is_superuser and not set(value).issubset(request.user.get_admin_permission_codes()):
            raise serializers.ValidationError("Bạn không thể cấp quyền vượt quá quyền của mình.")
        return value


class RoleAdminSerializer(serializers.ModelSerializer):
    permission_codes = serializers.SerializerMethodField()
    permission_names = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ("id", "code", "name", "description", "is_system", "permission_codes", "permission_names", "user_count")

    def get_permission_codes(self, role):
        return list(role.permissions.order_by("code").values_list("code", flat=True))

    def get_permission_names(self, role):
        return list(role.permissions.order_by("module", "code").values("code", "name", "module"))

    def get_user_count(self, role):
        return role.user_roles.count()


class VocabularyTopicAdminSerializer(serializers.ModelSerializer):
    term_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = VocabularyTopic
        fields = ("id", "slug", "name", "description", "source_url", "sort_order", "is_published", "term_count")


class VocabularyTermAdminSerializer(serializers.ModelSerializer):
    topic_ids = serializers.PrimaryKeyRelatedField(
        queryset=VocabularyTopic.objects.all(), many=True, required=False, write_only=True,
    )
    topics = serializers.SerializerMethodField()

    class Meta:
        model = VocabularyTerm
        fields = (
            "id", "word", "level", "part_of_speech", "pronunciation",
            "meaning_vi", "example_en", "is_active", "topic_ids", "topics",
        )

    @transaction.atomic
    def create(self, validated_data):
        topics = validated_data.pop("topic_ids", [])
        term = super().create(validated_data)
        self._save_topics(term, topics)
        return term

    @transaction.atomic
    def update(self, instance, validated_data):
        topics = validated_data.pop("topic_ids", None)
        term = super().update(instance, validated_data)
        if topics is not None:
            self._save_topics(term, topics)
        return term

    @staticmethod
    def _save_topics(term, topics):
        topic_ids = {topic.pk for topic in topics}
        TopicTerm.objects.filter(term=term).exclude(topic_id__in=topic_ids).delete()
        for topic in topics:
            TopicTerm.objects.get_or_create(
                topic=topic,
                term=term,
                defaults={
                    "sort_order": (topic.topic_terms.aggregate(last_order=Max("sort_order"))["last_order"] or 0) + 1,
                },
            )

    def get_topics(self, term):
        return list(term.topic_terms.order_by("sort_order").values_list("topic_id", flat=True))


class GrammarNoteAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrammarNote
        fields = ("id", "title", "body", "quick_rule", "example", "sort_order", "is_published")


class PartTipAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartTip
        fields = ("id", "part_number", "title", "body", "sort_order", "is_published")


class ExamAdminSerializer(serializers.ModelSerializer):
    parts = serializers.SerializerMethodField()
    completion_percent = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = (
            "id", "external_id", "title", "provider", "source_url", "year", "slug",
            "time_limit_seconds", "question_count", "answer_count", "status", "parts",
            "completion_percent",
        )

    def get_parts(self, exam):
        return [
            {"number": part.part_number, "title": part.title, "question_count": part.question_count}
            for part in exam.parts.all()
        ]

    def get_completion_percent(self, exam):
        if not exam.question_count:
            return 0
        return round(exam.answer_count * 100 / exam.question_count)


class ExamUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ("title", "year", "source_url", "time_limit_seconds", "status")

    def validate_status(self, value):
        if value not in {"draft", "published", "archived"}:
            raise serializers.ValidationError("Trạng thái phải là draft, published hoặc archived.")
        return value


class QuestionAdminUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    prompt = serializers.CharField(required=False, allow_blank=True)
    prompt_html = serializers.CharField(required=False, allow_blank=True)
    correct_option = serializers.ChoiceField(choices=("A", "B", "C", "D", ""), required=False, allow_blank=True)
    explanation_reason = serializers.CharField(required=False, allow_blank=True)
    explanation_tip = serializers.CharField(required=False, allow_blank=True)
    transcript = serializers.CharField(required=False, allow_blank=True)
    options = serializers.DictField(
        child=serializers.CharField(allow_blank=True), required=False,
    )

    def validate_options(self, value):
        allowed_keys = {"A", "B", "C", "D"}
        if set(value) - allowed_keys:
            raise serializers.ValidationError("Đáp án chỉ được dùng các lựa chọn A, B, C, D.")
        if len(value) < 2:
            raise serializers.ValidationError("Cần có ít nhất hai lựa chọn.")
        return value


class QuestionAdminListSerializer(serializers.ModelSerializer):
    part_number = serializers.IntegerField(source="exam_part.part_number", read_only=True)
    part_title = serializers.CharField(source="exam_part.title", read_only=True)
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id", "number", "part_number", "part_title", "title", "prompt",
            "prompt_html", "correct_option", "explanation_reason", "explanation_tip",
            "transcript", "options",
        )

    def get_options(self, question):
        return {option.option_key: option.answer_text for option in question.options.all()}


def user_payload(user):
    """Build the account response without exposing credentials or provider IDs."""
    return AdminUserSerializer(user).data


def user_detail_payload(user):
    """Include learning activity and safe login-method metadata for the admin UI."""
    attempts = TestAttempt.objects.filter(user=user).select_related("exam").annotate(
        correct_answers=Sum("part_scores__correct_count"),
        scored_questions=Sum("part_scores__scored_count"),
    ).order_by("-started_at")
    recent_attempts = []
    for attempt in attempts[:8]:
        correct = attempt.correct_answers or 0
        scored = attempt.scored_questions or 0
        recent_attempts.append({
            "id": str(attempt.id),
            "exam_title": attempt.exam.title,
            "mode": attempt.mode,
            "status": attempt.status,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "correct_answers": correct,
            "scored_questions": scored,
            "accuracy_percent": round(correct * 100 / scored) if scored else None,
        })

    identities = list(user.identities.order_by("provider", "created_at").values(
        "id", "provider", "email_at_provider", "created_at",
    ))
    quiz_rows = VocabularyQuizAttempt.objects.filter(user=user).annotate(
        answered_count=Count("answers", filter=Q(answers__answered_at__isnull=False)),
        answered_correct_count=Count(
            "answers",
            filter=Q(answers__answered_at__isnull=False, answers__is_correct=True),
        ),
    ).select_related("topic").order_by("-started_at")[:8]
    return {
        "user": user_payload(user),
        "dashboard": dashboard_summary_data(user),
        "streak": calculate_study_streak(user=user),
        "login_methods": {
            "password_enabled": user.has_usable_password(),
            "identities": identities,
        },
        "stats": {
            "test_attempts": TestAttempt.objects.filter(user=user).count(),
            "submitted_tests": TestAttempt.objects.filter(user=user, status="submitted").count(),
            "vocabulary_tracked": VocabularyProgress.objects.filter(user=user).count(),
            "vocabulary_learned": VocabularyProgress.objects.filter(user=user, status="learned").count(),
            "vocabulary_quizzes": VocabularyQuizAttempt.objects.filter(user=user).count(),
            "last_login": user.last_login,
        },
        "recent_attempts": recent_attempts,
        "recent_quizzes": [
            {
                "id": str(quiz.id),
                "scope": quiz.scope,
                "topic_name": quiz.topic.name if quiz.topic_id else None,
                "question_count": quiz.question_count,
                "answered_count": quiz.answered_count,
                "correct_count": quiz.answered_correct_count,
                "status": quiz.status,
                "started_at": quiz.started_at,
                "submitted_at": quiz.submitted_at,
            }
            for quiz in quiz_rows
        ],
    }


@api_view(["GET"])
@permission_classes([HasAdminPermission])
def admin_overview(request):
    """Summarize users, content volume, and exam-bank readiness."""
    exam_totals = Exam.objects.aggregate(
        questions=Count("parts__questions", distinct=True),
        answers=Count("parts__questions", filter=Q(parts__questions__correct_option__isnull=False) & ~Q(parts__questions__correct_option=""), distinct=True),
    )
    return Response({
        "users": {
            "total": User.objects.count(),
            "active": User.objects.filter(is_active=True).count(),
            "staff": User.objects.filter(
                Q(is_superuser=True) | Q(user_roles__role__permissions__code="admin.access"),
            ).distinct().count(),
        },
        "vocabulary": {
            "topics": VocabularyTopic.objects.count(),
            "published_topics": VocabularyTopic.objects.filter(is_published=True).count(),
            "terms": VocabularyTerm.objects.count(),
            "active_terms": VocabularyTerm.objects.filter(is_active=True).count(),
        },
        "knowledge": {
            "grammar_notes": GrammarNote.objects.count(),
            "published_grammar_notes": GrammarNote.objects.filter(is_published=True).count(),
            "part_tips": PartTip.objects.count(),
        },
        "exams": {
            "total": Exam.objects.count(),
            "published": Exam.objects.filter(status="published").count(),
            "questions": exam_totals["questions"],
            "answered_questions": exam_totals["answers"],
        },
        "recent_users": AdminUserSerializer(
            User.objects.order_by("-date_joined")[:6], many=True,
        ).data,
        "recent_attempts": list(TestAttempt.objects.select_related("user", "exam").order_by("-started_at")[:8].values(
            "id", "started_at", "status", "mode", "user__email", "exam__title",
        )),
        "generated_at": timezone.now(),
    })


@api_view(["GET", "PATCH"])
@permission_classes([HasAdminPermission])
def admin_users(request, user_id=None):
    """List accounts or update an account's active status."""
    if user_id is not None:
        user = get_object_or_404(User, pk=user_id)
        if request.method == "GET":
            return Response(user_detail_payload(user))
        if user.pk == request.user.pk and request.data.get("is_active") is False:
            return Response({"error": "Bạn không thể tự khóa tài khoản đang sử dụng."}, status=400)
        payload = AdminUserUpdateSerializer(data=request.data)
        if not payload.is_valid():
            return Response(payload.errors, status=400)
        user.is_active = payload.validated_data["is_active"]
        user.save(update_fields=["is_active"])
        return Response(user_payload(user))

    queryset = User.objects.annotate(attempt_count=Count("test_attempts", distinct=True)).order_by("-date_joined")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(email__icontains=search) | Q(display_name__icontains=search))
    state = request.query_params.get("status")
    if state == "active":
        queryset = queryset.filter(is_active=True)
    elif state == "disabled":
        queryset = queryset.filter(is_active=False)
    payload, error_response = page_payload(queryset, request, AdminUserSerializer)
    return error_response or Response(payload)


@api_view(["DELETE"])
@permission_classes([HasAdminPermission])
def admin_user_identity(request, user_id, provider):
    """Unlink a sign-in provider while preventing an account lockout."""
    user = get_object_or_404(User, pk=user_id)
    identity = get_object_or_404(user.identities, provider=provider)
    if not user.has_usable_password() and user.identities.count() <= 1:
        return Response({"error": "Không thể gỡ phương thức đăng nhập cuối cùng của tài khoản."}, status=400)
    identity.delete()
    return Response(user_detail_payload(user))


@api_view(["PATCH"])
@permission_classes([HasAdminPermission])
def admin_user_roles(request, user_id):
    """Replace a user's roles while recording the assigning administrator."""
    user = get_object_or_404(User, pk=user_id)
    serializer = UserRoleUpdateSerializer(data=request.data, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    roles = serializer.context["roles"]
    if user.pk == request.user.pk and not request.user.is_superuser:
        if not any("admin.access" in set(role.permissions.values_list("code", flat=True)) for role in roles):
            return Response({"error": "Bạn không thể tự gỡ quyền truy cập quản trị của mình."}, status=400)
    with transaction.atomic():
        user.user_roles.exclude(role__in=roles).delete()
        existing_ids = set(user.roles.values_list("id", flat=True))
        UserRole.objects.bulk_create([
            UserRole(user=user, role=role, assigned_by=request.user)
            for role in roles if role.id not in existing_ids
        ])
    return Response(user_detail_payload(user))


@api_view(["GET", "POST"])
@permission_classes([HasAdminPermission])
def admin_roles(request):
    """List the role catalog or create a custom role."""
    if request.method == "GET":
        queryset = Role.objects.prefetch_related("permissions").annotate(user_count=Count("user_roles")).order_by("name", "id")
        payload, error_response = page_payload(queryset, request, RoleAdminSerializer)
        if error_response:
            return error_response
        payload["available_permissions"] = list(AdminPermission.objects.order_by("module", "code").values(
            "code", "name", "module", "description",
        ))
        return Response(payload)
    serializer = RoleInputSerializer(data=request.data, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    values = serializer.validated_data
    role = Role.objects.create(
        code=values.get("code") or "custom-" + timezone.now().strftime("%Y%m%d%H%M%S%f"),
        name=values["name"],
        description=values.get("description", ""),
    )
    if "permission_codes" in values:
        role.permissions.set(AdminPermission.objects.filter(code__in=values["permission_codes"]))
    return Response(RoleAdminSerializer(role).data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([HasAdminPermission])
def admin_role_detail(request, role_id):
    """Inspect, update, or delete a custom role."""
    role = get_object_or_404(Role.objects.prefetch_related("permissions"), pk=role_id)
    if request.method == "GET":
        return Response(RoleAdminSerializer(role).data)
    if role.is_system:
        return Response({"error": "Vai trò hệ thống không thể chỉnh sửa hoặc xóa."}, status=400)
    if request.method == "DELETE":
        if role.user_roles.exists():
            return Response({"error": "Hãy gỡ vai trò khỏi người dùng trước khi xóa."}, status=409)
        role.delete()
        return Response(status=204)
    serializer = RoleInputSerializer(role, data=request.data, partial=True, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    values = serializer.validated_data
    for field in ("code", "name", "description"):
        if field in values:
            setattr(role, field, values[field])
    with transaction.atomic():
        role.save()
        if "permission_codes" in values:
            role.permissions.set(AdminPermission.objects.filter(code__in=values["permission_codes"]))
    return Response(RoleAdminSerializer(role).data)


@api_view(["GET", "POST"])
@permission_classes([HasAdminPermission])
def admin_topics(request):
    """List or create vocabulary topics."""
    if request.method == "POST":
        serializer = VocabularyTopicAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data, status=201)
    queryset = VocabularyTopic.objects.annotate(term_count=Count("topic_terms", distinct=True)).order_by("sort_order", "name")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(slug__icontains=search))
    payload, error_response = page_payload(queryset, request, VocabularyTopicAdminSerializer)
    return error_response or Response(payload)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([HasAdminPermission])
def admin_topic_detail(request, topic_id):
    """Read, update, or remove one vocabulary topic."""
    topic = get_object_or_404(VocabularyTopic, pk=topic_id)
    if request.method == "GET":
        return Response(VocabularyTopicAdminSerializer(topic).data)
    if request.method == "DELETE":
        topic.delete()
        return Response(status=204)
    serializer = VocabularyTopicAdminSerializer(topic, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([HasAdminPermission])
def admin_terms(request):
    """Search, list, or create vocabulary terms."""
    if request.method == "POST":
        serializer = VocabularyTermAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        term = serializer.save()
        return Response(VocabularyTermAdminSerializer(term).data, status=201)
    queryset = VocabularyTerm.objects.prefetch_related("topic_terms__topic").order_by("word")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(word__icontains=search) | Q(meaning_vi__icontains=search))
    payload, error_response = page_payload(queryset, request, VocabularyTermAdminSerializer)
    return error_response or Response(payload)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([HasAdminPermission])
def admin_term_detail(request, term_id):
    """Read, update, or remove one vocabulary term."""
    term = get_object_or_404(VocabularyTerm, pk=term_id)
    if request.method == "GET":
        return Response(VocabularyTermAdminSerializer(term).data)
    if request.method == "DELETE":
        term.delete()
        return Response(status=204)
    serializer = VocabularyTermAdminSerializer(term, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    return Response(VocabularyTermAdminSerializer(serializer.save()).data)


@api_view(["GET", "POST"])
@permission_classes([HasAdminPermission])
def admin_grammar(request):
    """List or create grammar notes."""
    if request.method == "POST":
        serializer = GrammarNoteAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data, status=201)
    queryset = GrammarNote.objects.order_by("sort_order", "title")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(body__icontains=search))
    payload, error_response = page_payload(queryset, request, GrammarNoteAdminSerializer)
    return error_response or Response(payload)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([HasAdminPermission])
def admin_grammar_detail(request, note_id):
    """Read, update, or remove a grammar note."""
    note = get_object_or_404(GrammarNote, pk=note_id)
    if request.method == "GET":
        return Response(GrammarNoteAdminSerializer(note).data)
    if request.method == "DELETE":
        note.delete()
        return Response(status=204)
    serializer = GrammarNoteAdminSerializer(note, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([HasAdminPermission])
def admin_tips(request):
    """List or create TOEIC part tips."""
    if request.method == "POST":
        serializer = PartTipAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data, status=201)
    queryset = PartTip.objects.order_by("part_number", "sort_order")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(body__icontains=search))
    payload, error_response = page_payload(queryset, request, PartTipAdminSerializer)
    return error_response or Response(payload)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([HasAdminPermission])
def admin_tip_detail(request, tip_id):
    """Read, update, or remove one TOEIC part tip."""
    tip = get_object_or_404(PartTip, pk=tip_id)
    if request.method == "GET":
        return Response(PartTipAdminSerializer(tip).data)
    if request.method == "DELETE":
        tip.delete()
        return Response(status=204)
    serializer = PartTipAdminSerializer(tip, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "PATCH"])
@permission_classes([HasAdminPermission])
def admin_exams(request, exam_id=None):
    """Browse exam metadata and update publication status or exam details."""
    if exam_id is not None:
        exam = get_object_or_404(Exam.objects.prefetch_related("parts"), pk=exam_id)
        if request.method == "GET":
            return Response(ExamAdminSerializer(exam).data)
        serializer = ExamUpdateSerializer(exam, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(ExamAdminSerializer(exam).data)

    queryset = Exam.objects.prefetch_related("parts").order_by("-year", "title")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(external_id__icontains=search))
    status_filter = request.query_params.get("status")
    if status_filter in {"draft", "published", "archived"}:
        queryset = queryset.filter(status=status_filter)
    payload, error_response = page_payload(queryset, request, ExamAdminSerializer)
    return error_response or Response(payload)


@api_view(["GET"])
@permission_classes([HasAdminPermission])
def admin_questions(request):
    """Search questions inside one selected exam, including answer options."""
    exam_id = request.query_params.get("exam")
    if not exam_id:
        return Response({"error": "Cần chọn một đề thi."}, status=400)
    queryset = Question.objects.filter(exam_part__exam_id=exam_id).select_related(
        "exam_part", "exam_part__exam", "passage",
    ).prefetch_related("options").order_by("exam_part__part_number", "number")
    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(Q(prompt__icontains=search) | Q(title__icontains=search) | Q(number__icontains=search))
    page, error_response = page_payload(queryset, request, QuestionAdminListSerializer)
    if error_response:
        return error_response
    return Response(page)


@api_view(["PATCH"])
@permission_classes([HasAdminPermission])
@transaction.atomic
def admin_question_detail(request, question_id):
    """Update a question, its options, and the exam's answer-completion count."""
    question = get_object_or_404(Question.objects.select_related("exam_part__exam"), pk=question_id)
    serializer = QuestionAdminUpdateSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    options = serializer.validated_data.pop("options", None)
    for field, value in serializer.validated_data.items():
        setattr(question, field, value)
    question.save(update_fields=list(serializer.validated_data.keys()) or None)
    if options is not None:
        for key, answer_text in options.items():
            QuestionOption.objects.update_or_create(
                question=question,
                option_key=key,
                defaults={"answer_text": answer_text},
            )
        QuestionOption.objects.filter(question=question).exclude(option_key__in=options).delete()
    exam = question.exam_part.exam
    exam.answer_count = Question.objects.filter(
        exam_part__exam=exam,
        correct_option__isnull=False,
    ).exclude(correct_option="").count()
    exam.question_count = Question.objects.filter(exam_part__exam=exam).count()
    exam.save(update_fields=["answer_count", "question_count"])
    question = Question.objects.select_related("exam_part").prefetch_related("options").get(pk=question.pk)
    return Response({
        "id": question.id,
        "number": question.number,
        "part_number": question.exam_part.part_number,
        "title": question.title,
        "prompt": question.prompt,
        "prompt_html": question.prompt_html,
        "correct_option": question.correct_option or "",
        "explanation_reason": question.explanation_reason,
        "explanation_tip": question.explanation_tip,
        "transcript": question.transcript,
        "options": {option.option_key: option.answer_text for option in question.options.all()},
    })
