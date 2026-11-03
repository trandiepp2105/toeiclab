"""URLs for the staff-only application dashboard API."""
from django.urls import path

from . import admin_views

urlpatterns = [
    path("overview/", admin_views.admin_overview, name="admin-overview"),
    path("users/", admin_views.admin_users, name="admin-users"),
    path("users/<uuid:user_id>/", admin_views.admin_users, name="admin-user-detail"),
    path("users/<uuid:user_id>/identities/<str:provider>/", admin_views.admin_user_identity, name="admin-user-identity"),
    path("users/<uuid:user_id>/roles/", admin_views.admin_user_roles, name="admin-user-role-assignment"),
    path("roles/", admin_views.admin_roles, name="admin-roles"),
    path("roles/<int:role_id>/", admin_views.admin_role_detail, name="admin-role-detail"),
    path("vocabulary/topics/", admin_views.admin_topics, name="admin-vocabulary-topics"),
    path("vocabulary/topics/<int:topic_id>/", admin_views.admin_topic_detail, name="admin-vocabulary-topic-detail"),
    path("vocabulary/terms/", admin_views.admin_terms, name="admin-vocabulary-terms"),
    path("vocabulary/terms/<int:term_id>/", admin_views.admin_term_detail, name="admin-vocabulary-term-detail"),
    path("knowledge/grammar/", admin_views.admin_grammar, name="admin-grammar-notes"),
    path("knowledge/grammar/<int:note_id>/", admin_views.admin_grammar_detail, name="admin-grammar-detail"),
    path("knowledge/part-tips/", admin_views.admin_tips, name="admin-part-tips"),
    path("knowledge/part-tips/<int:tip_id>/", admin_views.admin_tip_detail, name="admin-part-tip-detail"),
    path("exams/", admin_views.admin_exams, name="admin-exams"),
    path("exams/<int:exam_id>/", admin_views.admin_exams, name="admin-exam-detail"),
    path("questions/", admin_views.admin_questions, name="admin-questions"),
    path("questions/<int:question_id>/", admin_views.admin_question_detail, name="admin-question-detail"),
]
