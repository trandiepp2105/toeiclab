"""Thin HTTP controllers for TOEIC Lab APIs."""
import logging
import re, secrets
import smtplib
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.core import signing
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import BooleanField, Count, Exists, F, OuterRef, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import OtpChallenge
from users.services import verify_google_credential, get_or_create_google_user
from users.email_templates import registration_otp_email, password_reset_otp_email
from content.models import Exam, ExamPart, Direction, Question, QuestionOption
from vocabulary.models import VocabularyTopic, VocabularyTerm, TopicTerm
from learning.models import VocabularyProgress, VocabularyQuizAttempt, VocabularyQuizAnswer, PartPracticeProgress
from learning.services import create_quiz, answer_quiz, submit_quiz, calculate_study_streak
from assessments.models import TestAttempt, TestAnswer, PartScore
from assessments.services import (
    ActiveFullTestExists,
    start_attempt,
    save_answers,
    save_attempt_progress,
    submit_attempt,
    record_part_practice,
)
from assessments.scoring import attempt_time_state, full_test_toeic_result
from knowledge.models import GrammarNote, PartTip, KnowledgeArticle
from users.serializers import RegisterOtpRequestSerializer,RegisterOtpVerifySerializer,LoginSerializer,GoogleCredentialSerializer,ChangePasswordSerializer,PasswordResetRequestSerializer,PasswordResetVerifySerializer,PasswordResetCompleteSerializer
from assessments.serializers import (
    AttemptProgressSerializer,
    StartAttemptSerializer,
    SaveAnswersSerializer,
)
from content.serializers import PracticeCheckSerializer
from learning.serializers import CreateQuizSerializer,AnswerQuizSerializer
from core.observability import log_event

logger = logging.getLogger(__name__)

User=get_user_model()
PART_NAMES={1:'Photographs',2:'Question-Response',3:'Conversations',4:'Talks',5:'Incomplete Sentences',6:'Text Completion',7:'Reading Comprehension'}
def error(message,code=400):return Response({'error':str(message)},status=code)
def token_pair(user):
    """Create the access/refresh JWT pair returned after authentication."""
    refresh=RefreshToken.for_user(user)
    return {'access':str(refresh.access_token),'refresh':str(refresh)}
def asset_url(path):
    if not path:return ''
    path=str(path).lstrip('./')
    if path.split('/')[0].isdigit():path='zenlish_data/'+path
    return '/assets/'+path
def user_json(user):
    return {
        'id': str(user.pk),
        'email': user.email,
        'display_name': user.display_name,
        'email_verified': user.email_verified,
        'is_staff': user.is_staff,
    }
def term_json(term):
    assets={x.asset_role:asset_url(x.storage_path) for x in term.assets.all()}
    return {'id':term.pk,'word':term.word,'level':term.level,'part_of_speech':term.part_of_speech,'pronunciation':term.pronunciation,'meaning_vi':term.meaning_vi,'example_en':term.example_en,'image':assets.get('image',''),'audio_word':assets.get('word_audio',''),'audio_example':assets.get('example_audio','')}
def question_json(q,include_key=False):
    media=q.media or {};html=q.prompt_html or ''
    def rewrite_images(source,paths):
        for path in paths:
            name=str(path).split('/')[-1]
            source=re.sub(r'(<img\b[^>]*\bsrc=["\'])[^"\']*('+re.escape(name)+r')(["\'])',lambda m:m.group(1)+asset_url(path)+m.group(3),source,flags=re.I)
        return source
    html=rewrite_images(html,media.get('images',[]))
    passage_html=q.passage.content_html if q.passage_id else ''
    if q.passage_id:passage_html=rewrite_images(passage_html,q.passage.assets or [])
    data={'id':q.pk,'number':q.number,'part_number':q.exam_part.part_number,'title':q.title,'question':q.prompt,'content_html':html,'options':{o.option_key:o.answer_text for o in q.options.all()},'explanation':{'reason':q.explanation_reason,'tip':q.explanation_tip},'transcript':q.transcript,'audio_files':[asset_url(x) for x in media.get('audio',[])],'image_files':[asset_url(x) for x in media.get('images',[])],'passage_id':q.passage_id,'passage_html':passage_html,'passage_assets':[asset_url(x) for x in (q.passage.assets if q.passage_id else [])]}
    if include_key:data['correct_answer']=q.correct_option
    return data
def exam_json(exam, include_readiness=False):
    data={'id':exam.external_id,'slug':exam.slug,'title':exam.title,'year':exam.year,'source_url':exam.source_url,'question_count':exam.question_count,'answer_count':exam.answer_count,'answers_complete':exam.question_count>0 and exam.question_count==exam.answer_count,'has_attempted':getattr(exam,'has_attempted',False),'time_limit_seconds':exam.time_limit_seconds,'parts':[{'number':p.part_number,'title':p.title,'name':PART_NAMES.get(p.part_number),'question_count':p.question_count} for p in exam.parts.all()]}
    if include_readiness:
        questions=Question.objects.filter(exam_part__exam=exam).values('media','transcript')
        data.update({'audio_count':sum(bool((q['media'] or {}).get('audio')) for q in questions),'image_count':sum(bool((q['media'] or {}).get('images')) for q in questions),'transcript_count':sum(bool(q['transcript']) for q in questions)})
    return data


def group_exam_payloads(exam_payloads):
    """Group serialized exams by year, newest year first."""
    grouped = {}
    for exam in exam_payloads:
        grouped.setdefault(exam.get('year'), []).append(exam)

    ordered_years = sorted(
        (year for year in grouped if year is not None),
        reverse=True,
    )
    if None in grouped:
        ordered_years.append(None)

    return [
        {
            'year': year,
            'label': str(year) if year is not None else 'Khác',
            'count': len(grouped[year]),
            'exams': grouped[year],
        }
        for year in ordered_years
    ]

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):return Response({'status':'ok','service':'toeiclab-api'})
@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def csrf(request):return Response({'csrfToken':get_token(request)})
@api_view(['POST'])
@permission_classes([AllowAny])
def register_request_otp(request):
    payload=RegisterOtpRequestSerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'otp_send_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors,status=400)
    email=payload.validated_data['email'];password=payload.validated_data['password']
    if User.objects.filter(email__iexact=email).exists():
        log_event(logger, logging.WARNING, 'otp_send_failed', service='auth', error_code='account_exists', status_code=409)
        return error('Email đã đăng ký.',409)
    if OtpChallenge.objects.filter(email=email,purpose='register',sent_at__gt=timezone.now()-timedelta(seconds=60)).exists():
        log_event(logger, logging.WARNING, 'otp_send_failed', service='auth', error_code='rate_limited', status_code=429)
        return error('Chờ 60 giây trước khi gửi lại OTP.',429)
    code=f'{secrets.randbelow(1000000):06d}'
    OtpChallenge.objects.create(
        email=email,
        purpose='register',
        display_name=payload.validated_data.get('display_name', ''),
        password_hash=make_password(password),
        code_hash=make_password(code),
        expires_at=timezone.now()+timedelta(minutes=10),
    )
    subject, text_body, html_body = registration_otp_email(code)
    try:
        send_mail(subject, text_body, settings.DEFAULT_FROM_EMAIL, [email], html_message=html_body)
    except (OSError, smtplib.SMTPException):
        OtpChallenge.objects.filter(email=email, purpose='register', verified_at__isnull=True).delete()
        log_event(logger, logging.ERROR, 'otp_delivery_failed', service='email', error_code='email_delivery_failed', exc_info=True)
        return error('Không gửi được email lúc này. Vui lòng thử lại sau.', 503)
    log_event(logger, logging.INFO, 'otp_sent', service='auth')
    result={'message':'Đã gửi mã OTP.'}
    if settings.DEBUG:result['development_otp']=code
    return Response(result)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_verify(request):
    payload=RegisterOtpVerifySerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors,status=400)
    email=payload.validated_data['email'];code=payload.validated_data['otp'];challenge=OtpChallenge.objects.filter(email=email,purpose='register',verified_at__isnull=True).order_by('-sent_at').first()
    if not challenge or challenge.expires_at<timezone.now() or challenge.attempts>=5:
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='otp_expired_or_unavailable', status_code=400)
        return error('OTP hết hạn hoặc không hợp lệ.')
    challenge.attempts+=1;challenge.save(update_fields=['attempts'])
    if not check_password(code,challenge.code_hash):
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='otp_invalid', status_code=400)
        return error('OTP không chính xác.')
    user=User.objects.create_user(
        email=email,
        password=None,
        display_name=challenge.display_name,
        email_verified=True,
    )
    user.password = challenge.password_hash
    user.save(update_fields=['password', 'email_verified'])
    challenge.verified_at=timezone.now();challenge.save(update_fields=['verified_at'])
    log_event(logger, logging.INFO, 'registration_completed', service='auth', user_id=user.pk)
    return Response({**token_pair(user),'user':user_json(user)},status=201)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    payload=LoginSerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'login_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors,status=400)
    email=payload.validated_data['email']
    password=payload.validated_data['password']
    if not User.objects.filter(email__iexact=email).exists():
        log_event(logger, logging.WARNING, 'login_failed', service='auth', error_code='account_not_found', status_code=404)
        return error('Tài khoản không tồn tại. Vui lòng đăng ký.',404)
    user=authenticate(request,email=email,password=password)
    if not user:
        log_event(logger, logging.WARNING, 'login_failed', service='auth', error_code='invalid_credentials', status_code=400)
        return error('Email hoặc mật khẩu không đúng.')
    if not user.email_verified:
        log_event(logger, logging.WARNING, 'login_failed', service='auth', error_code='email_not_verified', status_code=403)
        return error('Email chưa được xác minh OTP.',403)
    log_event(logger, logging.INFO, 'login_succeeded', service='auth', user_id=user.pk)
    return Response({**token_pair(user),'user':user_json(user)})
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    payload=GoogleCredentialSerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'google_sign_in_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors,status=400)
    try:
        claims=verify_google_credential(payload.validated_data['credential'])
        user=get_or_create_google_user(claims)
    except ValueError as exc:
        status = 503 if 'chưa được cấu hình' in str(exc) else 400
        log_event(logger, logging.WARNING, 'google_sign_in_failed', service='auth', error_code='credential_verification_failed', status_code=status)
        return error(exc,status)
    log_event(logger, logging.INFO, 'google_sign_in_succeeded', service='auth', user_id=user.pk)
    return Response({**token_pair(user),'user':user_json(user)})
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """End the client JWT session; the frontend removes both token cookies."""
    return Response(status=204)
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_session(request):
    """Exchange a valid refresh JWT for a new access JWT."""
    payload=TokenRefreshSerializer(data=request.data)
    try:
        if not payload.is_valid():
            log_event(logger, logging.WARNING, 'refresh_token_failed', service='auth', error_code='invalid_refresh_token', status_code=401)
            return Response(payload.errors,status=401)
    except User.DoesNotExist:
        log_event(logger, logging.WARNING, 'refresh_token_failed', service='auth', error_code='user_not_found', status_code=401)
        return error('Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.',401)
    log_event(logger, logging.INFO, 'refresh_token_succeeded', service='auth')
    return Response(payload.validated_data)
@api_view(['GET','PATCH'])
def me(request):
    if not request.user.is_authenticated:return error('Bạn cần đăng nhập.',401)
    if request.method=='PATCH':request.user.display_name=str(request.data.get('display_name',''))[:120];request.user.save(update_fields=['display_name'])
    return Response(user_json(request.user))
@api_view(['POST'])
def change_password(request):
    if not request.user.is_authenticated:return error('Bạn cần đăng nhập.',401)
    payload=ChangePasswordSerializer(data=request.data)
    if not payload.is_valid():return Response(payload.errors,status=400)
    current=payload.validated_data['current_password'];new=payload.validated_data['new_password']
    if not request.user.check_password(current):
        log_event(logger, logging.WARNING, 'password_change_failed', service='auth', user_id=request.user.pk, error_code='current_password_invalid', status_code=400)
        return error('Mật khẩu hiện tại không chính xác.',400)
    request.user.set_password(new);request.user.save(update_fields=['password'])
    log_event(logger, logging.INFO, 'password_changed', service='auth', user_id=request.user.pk)
    return Response({'message':'Đã cập nhật mật khẩu.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_otp(request):
    """Send a reset OTP without revealing whether an email has an account."""
    payload = PasswordResetRequestSerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'password_reset_otp_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors, status=400)

    email = payload.validated_data['email']
    recent_challenge = OtpChallenge.objects.filter(
        email__iexact=email,
        purpose='password_reset',
        sent_at__gt=timezone.now() - timedelta(seconds=60),
    ).exists()
    if recent_challenge:
        log_event(logger, logging.WARNING, 'password_reset_otp_failed', service='auth', error_code='rate_limited', status_code=429)
        return error('Vui lòng chờ 60 giây trước khi yêu cầu mã mới.', 429)

    # Identical response for unknown addresses prevents account enumeration.
    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        return Response({'message': 'Nếu email đã đăng ký, hướng dẫn xác nhận sẽ được gửi tới hộp thư.'})

    code = f'{secrets.randbelow(1_000_000):06d}'
    challenge = OtpChallenge.objects.create(
        email=user.email,
        purpose='password_reset',
        password_hash='',
        code_hash=make_password(code),
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    subject, text_body, html_body = password_reset_otp_email(code)
    try:
        send_mail(subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_body)
    except (OSError, smtplib.SMTPException):
        challenge.delete()
        log_event(logger, logging.ERROR, 'otp_delivery_failed', service='email', error_code='email_delivery_failed', user_id=user.pk, exc_info=True)
        return error('Không gửi được email lúc này. Vui lòng thử lại sau.', 503)

    log_event(logger, logging.INFO, 'password_reset_otp_sent', service='auth', user_id=user.pk)
    return Response({'message': 'Nếu email đã đăng ký, hướng dẫn xác nhận sẽ được gửi tới hộp thư.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_verify_otp(request):
    """Verify an OTP and issue a signed token for one password update."""
    payload = PasswordResetVerifySerializer(data=request.data)
    if not payload.is_valid():
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='invalid_request', status_code=400)
        return Response(payload.errors, status=400)

    email = payload.validated_data['email']
    challenge = OtpChallenge.objects.filter(
        email__iexact=email,
        purpose='password_reset',
        verified_at__isnull=True,
    ).order_by('-sent_at').first()
    if (
        challenge is None
        or challenge.expires_at <= timezone.now()
        or challenge.attempts >= 5
    ):
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='otp_expired_or_unavailable', status_code=400)
        return error('Mã OTP đã hết hạn hoặc không hợp lệ.')

    challenge.attempts += 1
    challenge.save(update_fields=['attempts'])
    if not check_password(payload.validated_data['otp'], challenge.code_hash):
        log_event(logger, logging.WARNING, 'otp_verification_failed', service='auth', error_code='otp_invalid', status_code=400)
        return error('Mã OTP không chính xác.')

    challenge.verified_at = timezone.now()
    challenge.save(update_fields=['verified_at'])
    reset_token = signing.dumps(
        {'challenge_id': challenge.pk, 'email': challenge.email},
        salt='toeiclab.password-reset',
    )
    log_event(logger, logging.INFO, 'password_reset_otp_verified', service='auth')
    return Response({'reset_token': reset_token})


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def password_reset_complete(request):
    """Set a new password only for an unexpired, verified, unused OTP token."""
    payload = PasswordResetCompleteSerializer(data=request.data)
    if not payload.is_valid():
        return Response(payload.errors, status=400)

    try:
        token_data = signing.loads(
            payload.validated_data['reset_token'],
            salt='toeiclab.password-reset',
            max_age=600,
        )
    except signing.SignatureExpired:
        log_event(logger, logging.WARNING, 'password_reset_failed', service='auth', error_code='reset_token_expired', status_code=400)
        return error('Phiên xác nhận đã hết hạn. Vui lòng yêu cầu mã OTP mới.')
    except signing.BadSignature:
        log_event(logger, logging.WARNING, 'password_reset_failed', service='auth', error_code='reset_token_invalid', status_code=400)
        return error('Yêu cầu đổi mật khẩu không hợp lệ. Vui lòng xác nhận OTP lại.')

    challenge = OtpChallenge.objects.select_for_update().filter(
        pk=token_data.get('challenge_id'),
        email=token_data.get('email'),
        purpose='password_reset',
    ).first()
    if (
        challenge is None
        or challenge.verified_at is None
        or challenge.verified_at < timezone.now() - timedelta(minutes=10)
    ):
        log_event(logger, logging.WARNING, 'password_reset_failed', service='auth', error_code='challenge_expired_or_used', status_code=400)
        return error('Yêu cầu đổi mật khẩu đã hết hạn hoặc đã được sử dụng.')

    user = User.objects.filter(email__iexact=challenge.email).first()
    if user is None:
        challenge.delete()
        return error('Không tìm thấy tài khoản tương ứng.', 404)

    new_password = payload.validated_data['new_password']
    user.set_password(new_password)
    user.save(update_fields=['password'])
    # Deleting the verified challenge makes the signed token single-use.
    challenge.delete()
    log_event(logger, logging.INFO, 'password_reset_completed', service='auth', user_id=user.pk)
    return Response({'message': 'Mật khẩu đã được đổi thành công.'})

@api_view(['GET'])
@permission_classes([AllowAny])
def exam_list(request):
    qs=Exam.objects.prefetch_related('parts').order_by('-year','title','external_id');state=request.query_params.get('answers')
    if request.user.is_authenticated:
        qs=qs.annotate(has_attempted=Exists(TestAttempt.objects.filter(exam_id=OuterRef('pk'),user=request.user)))
    else:
        qs=qs.annotate(has_attempted=Value(False,output_field=BooleanField()))
    if state=='complete':qs=qs.filter(question_count=F('answer_count'),question_count__gt=0)
    elif state=='incomplete':qs=qs.exclude(question_count=F('answer_count'))
    query=request.query_params.get('q','').strip()
    if query:qs=qs.filter(title__icontains=query)
    year_query=request.query_params.get('year')
    if year_query:
        try:
            qs=qs.filter(year=int(year_query))
        except ValueError:
            return error('year phải là số nguyên.')
    try:page=max(1,int(request.query_params.get('page',1)));size=min(200,max(1,int(request.query_params.get('page_size',100))))
    except ValueError:return error('page và page_size phải là số nguyên.')
    count=qs.count()
    payloads=[exam_json(x) for x in qs[(page-1)*size:page*size]]
    groups=group_exam_payloads(payloads)
    return Response({'count':count,'page':page,'page_size':size,'groups':groups,'results':[exam for group in groups for exam in group['exams']]})
@api_view(['GET'])
@permission_classes([AllowAny])
def exam_detail(request,exam_slug):
    obj=Exam.objects.prefetch_related('parts').filter(Q(slug=exam_slug)|Q(external_id=exam_slug)).first()
    return Response(exam_json(obj, include_readiness=True)) if obj else error('Không tìm thấy đề.',404)


@api_view(['GET'])
@permission_classes([AllowAny])
def exam_answer_transcript(request, exam_slug):
    """Return the read-only answer guide for every question in an exam."""
    exam = (
        Exam.objects.prefetch_related(
            'parts__questions__options',
            'parts__questions__passage',
        )
        .filter(Q(slug=exam_slug) | Q(external_id=exam_slug))
        .first()
    )
    if not exam:
        return error('Không tìm thấy đề.', 404)

    parts = []
    for part in exam.parts.all():
        questions = [
            question_json(question, include_key=True)
            for question in part.questions.all()
        ]
        parts.append({
            'number': part.part_number,
            'title': part.title,
            'name': PART_NAMES.get(part.part_number),
            'question_count': part.question_count,
            'questions': questions,
        })

    return Response({
        'exam': exam_json(exam),
        'parts': parts,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def exam_parts(request,exam_slug):
    exam=Exam.objects.filter(Q(slug=exam_slug)|Q(external_id=exam_slug)).first()
    if not exam:return error('Không tìm thấy đề.',404)
    return Response([{'number':p.part_number,'title':p.title,'name':PART_NAMES.get(p.part_number),'question_count':p.question_count} for p in exam.parts.all()])
@api_view(['GET'])
@permission_classes([AllowAny])
def part_detail(request,exam_slug,part_number):
    exam=Exam.objects.filter(Q(slug=exam_slug)|Q(external_id=exam_slug)).first()
    if not exam:return error('Không tìm thấy đề.',404)
    qs=Question.objects.filter(exam_part__exam=exam,exam_part__part_number=part_number).select_related('exam_part','passage').prefetch_related('options')
    selected={};attempt=TestAttempt.objects.filter(pk=request.query_params.get('attempt'),exam=exam).first() if request.query_params.get('attempt') else None
    if attempt and (not attempt.user_id or attempt.user_id==getattr(request.user,'id',None)):selected={a.question_id:a.selected_option for a in attempt.answers.filter(question__in=qs)}
    return Response({'exam':exam_json(exam),'part_number':part_number,'questions':[dict(question_json(q),selected_answer=selected.get(q.pk,'')) for q in qs]})


PRACTICE_SINGLE_PARTS = {1, 2, 5}


def practice_group_key(question, part_number):
    """Return the navigation group key for a practice question."""
    if part_number in PRACTICE_SINGLE_PARTS:
        return f'question-{question.pk}'

    exam_id = question.exam_part.exam_id
    if part_number in (3, 4):
        # These audio sets may not have a Passage row; their shared set label
        # is stored in prompt (for example "PART 3.32-34").
        if question.prompt:
            return f'group-{exam_id}-{question.prompt}'
        if question.passage_id:
            return f'passage-{exam_id}-{question.passage_id}'
        return f'question-{question.pk}'

    if part_number in (6, 7) and question.passage_id:
        return f'passage-{exam_id}-{question.passage_id}'

    return f'question-{question.pk}'


def practice_questions_json(question, part_number):
    """Serialize a question with the context needed by part practice."""
    data = question_json(question)
    data.update({
        'exam': {
            'id': question.exam_part.exam.external_id,
            'slug': question.exam_part.exam.slug,
            'title': question.exam_part.exam.title,
            'year': question.exam_part.exam.year,
        },
        'group_key': practice_group_key(question, part_number),
        'practice_mode': 'single' if part_number in PRACTICE_SINGLE_PARTS else 'group',
    })
    return data


@api_view(['GET'])
def practice_part_list(request):
    """List the seven Parts and aggregate their question counts."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để luyện tập từng Part.', 401)

    counts = {
        row['part_number']: row['question_count']
        for row in ExamPart.objects.values('part_number').annotate(
            question_count=Sum('question_count'),
        )
    }
    descriptions = {
        1: 'Nghe 4 câu mô tả và chọn câu phù hợp nhất với hình ảnh.',
        2: 'Nghe một câu hỏi hoặc lời nói, chọn phản hồi phù hợp nhất.',
        3: 'Nghe các đoạn hội thoại và trả lời câu hỏi theo từng đoạn.',
        4: 'Nghe các bài nói ngắn và trả lời câu hỏi theo từng bài.',
        5: 'Chọn từ hoặc cụm từ phù hợp để hoàn thành câu.',
        6: 'Đọc một đoạn văn ngắn và chọn đáp án cho từng chỗ trống.',
        7: 'Đọc các văn bản liên quan rồi trả lời câu hỏi theo passage.',
    }
    return Response([
        {
            'part_number': part_number,
            'name': PART_NAMES.get(part_number),
            'question_count': counts.get(part_number, 0),
            'practice_mode': 'single' if part_number in PRACTICE_SINGLE_PARTS else 'group',
            'description': descriptions[part_number],
        }
        for part_number in range(1, 8)
    ])


PRACTICE_WINDOW_GROUPS = 6
PRACTICE_ORDER = ('practice_year', 'exam_part__exam__title', 'exam_part__exam_id', 'number', 'pk')


def practice_cursor_filter(cursor, *, after):
    """Build a stable keyset condition matching the practice question ordering."""
    values = [cursor.practice_year, cursor.exam_part.exam.title, cursor.exam_part.exam_id, cursor.number, cursor.pk]
    condition = Q()
    for index, (field, value) in enumerate(zip(PRACTICE_ORDER, values)):
        # Year sorts descending; the remaining cursor fields sort ascending.
        use_greater = not after if field == 'practice_year' else after
        lookup = 'gt' if use_greater else 'lt'
        clause = Q(**{f'{field}__{lookup}': value})
        for previous_field, previous_value in zip(PRACTICE_ORDER[:index], values[:index]):
            clause &= Q(**{previous_field: previous_value})
        condition |= clause
    return condition


def practice_group_filter(question, part_number):
    """Return a query matching every question in the same navigation group."""
    exam_part_id = question.exam_part_id
    if part_number in PRACTICE_SINGLE_PARTS:
        return Q(pk=question.pk)
    if part_number in (3, 4) and question.prompt:
        return Q(exam_part_id=exam_part_id, prompt=question.prompt)
    if question.passage_id:
        return Q(exam_part_id=exam_part_id, passage_id=question.passage_id)
    return Q(pk=question.pk)


@api_view(['GET'])
def practice_part_questions(request, part_number):
    """Return a bounded question window and the authenticated user's saved cursor."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để luyện tập từng Part.', 401)
    if part_number not in range(1, 8):
        return error('Part không hợp lệ.', 404)
    base = Question.objects.filter(exam_part__part_number=part_number).annotate(
        practice_year=Coalesce('exam_part__exam__year', Value(0)),
    )
    progress = PartPracticeProgress.objects.filter(
        user=request.user, part_number=part_number,
    ).only('last_question_id').first()
    direction = request.query_params.get('direction', 'around')
    cursor_id = request.query_params.get('cursor')
    cursor = None
    if cursor_id:
        cursor = base.select_related('exam_part__exam').filter(pk=cursor_id).first()
        if cursor is None:
            return error('Vị trí câu hỏi không hợp lệ.', 400)
    elif direction != 'first' and progress and progress.last_question_id:
        cursor = base.select_related('exam_part__exam').filter(pk=progress.last_question_id).first()
    if direction not in {'around', 'next', 'previous', 'first'}:
        return error('Hướng tải câu hỏi không hợp lệ.', 400)
    if direction == 'first':
        cursor = None
    elif cursor is None and progress and progress.last_question_id:
        cursor = base.select_related('exam_part__exam').filter(pk=progress.last_question_id).first()
    reverse_window = direction == 'previous'
    if cursor is None:
        candidates = base.order_by('-practice_year', 'exam_part__exam__title', 'exam_part__exam_id', 'number', 'pk')[:PRACTICE_WINDOW_GROUPS * 12]
    else:
        condition = practice_cursor_filter(cursor, after=direction != 'previous')
        if direction == 'around':
            condition |= Q(pk=cursor.pk)
        candidates = base.filter(condition).order_by(
            *(['practice_year', '-exam_part__exam__title', '-exam_part__exam_id', '-number', '-pk'] if reverse_window else ['-practice_year', 'exam_part__exam__title', 'exam_part__exam_id', 'number', 'pk'])
        )[:PRACTICE_WINDOW_GROUPS * 12]
    candidate_rows = list(candidates.select_related('exam_part__exam', 'passage').prefetch_related('options'))
    if reverse_window:
        candidate_rows.reverse()
    selected_groups = []
    selected_keys = set()
    for question in candidate_rows:
        key = practice_group_key(question, part_number)
        if key not in selected_keys:
            selected_groups.append((key, question))
            selected_keys.add(key)
            if len(selected_groups) == PRACTICE_WINDOW_GROUPS:
                break
    group_query = Q(pk__in=[])
    for _, representative in selected_groups:
        group_query |= practice_group_filter(representative, part_number)
    window_questions = list(base.filter(group_query).select_related(
        'exam_part__exam', 'passage',
    ).prefetch_related('options').order_by(
        '-practice_year', 'exam_part__exam__title', 'exam_part__exam_id', 'number', 'pk',
    ))
    groups = []
    by_key = {}
    for question in window_questions:
        key = practice_group_key(question, part_number)
        group = by_key.get(key)
        if group is None:
            group = {
                'key': key,
                'exam': {
                    'id': question.exam_part.exam.external_id,
                    'slug': question.exam_part.exam.slug,
                    'title': question.exam_part.exam.title,
                    'year': question.exam_part.exam.year,
                },
                'questions': [],
            }
            by_key[key] = group
            groups.append(group)
        group['questions'].append(practice_questions_json(question, part_number))
    first_question = window_questions[0] if window_questions else None
    question_offset = (
        base.filter(practice_cursor_filter(first_question, after=False)).count()
        if first_question else 0
    )
    return Response({
        'part_number': part_number,
        'name': PART_NAMES.get(part_number),
        'practice_mode': 'single' if part_number in PRACTICE_SINGLE_PARTS else 'group',
        'groups': groups,
        'total_questions': base.count(),
        'question_offset': question_offset,
        'start_cursor': first_question.pk if first_question else None,
        'end_cursor': window_questions[-1].pk if window_questions else None,
        'has_previous': question_offset > 0,
        'has_next': bool(window_questions) and question_offset + len(window_questions) < base.count(),
        'saved_question_id': progress.last_question_id if progress else None,
    })


@api_view(['PATCH'])
def practice_part_progress(request, part_number):
    """Persist the current group cursor for the authenticated learner."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để lưu tiến độ luyện tập.', 401)
    if part_number not in range(1, 8):
        return error('Part không hợp lệ.', 404)
    question_id = request.data.get('question_id')
    question = Question.objects.filter(pk=question_id, exam_part__part_number=part_number).first()
    if not question:
        return error('Vị trí câu hỏi không hợp lệ.', 400)
    progress, _ = PartPracticeProgress.objects.get_or_create(user=request.user, part_number=part_number)
    progress.last_question = question
    progress.save(update_fields=['last_question', 'updated_at'])
    return Response({'part_number': part_number, 'question_id': question.pk})


@api_view(['POST'])
def practice_check_answers(request):
    """Check answers and persist an authenticated Part-practice result."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để lưu kết quả luyện tập.', 401)
    payload = PracticeCheckSerializer(data=request.data)
    if not payload.is_valid():
        return Response(payload.errors, status=400)
    answer_map = payload.validated_data['answers']
    questions = Question.objects.filter(
        pk__in=[int(question_id) for question_id in answer_map],
    ).select_related('exam_part').prefetch_related('options')
    question_map = {str(question.pk): question for question in questions}
    if len(question_map) != len(answer_map):
        log_event(logger, logging.WARNING, 'part_answer_check_failed', service='assessment', user_id=request.user.pk, error_code='question_not_found', status_code=400)
        return error('Một hoặc nhiều câu hỏi không tồn tại.', 400)
    if len({question.exam_part_id for question in question_map.values()}) != 1:
        log_event(logger, logging.WARNING, 'part_answer_check_failed', service='assessment', user_id=request.user.pk, error_code='mixed_parts', status_code=400)
        return error('Một lượt luyện chỉ được chứa câu hỏi trong cùng một Part.', 400)

    checked = []
    for question_id, selected in answer_map.items():
        question = question_map[question_id]
        valid_option = QuestionOption.objects.filter(
            question=question,
            option_key=selected,
        ).exists()
        if not valid_option:
            log_event(logger, logging.WARNING, 'part_answer_check_failed', service='assessment', user_id=request.user.pk, error_code='invalid_answer_option', status_code=400, part_number=question.exam_part.part_number)
            return error(f'Đáp án {selected} không hợp lệ cho câu {question.number}.', 400)
        checked.append({
            'question_id': question.pk,
            'selected_answer': selected,
            'correct_answer': question.correct_option,
            'is_correct': bool(question.correct_option and selected == question.correct_option),
            'explanation': {
                'reason': question.explanation_reason,
                'tip': question.explanation_tip,
            },
        })

    ordered_questions = [
        question_map[str(question_id)]
        for question_id in answer_map
    ]
    try:
        record_part_practice(
            user=request.user,
            questions=ordered_questions,
            selected_answers=answer_map,
        )
    except ValueError as exc:
        log_event(logger, logging.WARNING, 'part_answer_check_failed', service='assessment', user_id=request.user.pk, error_code='answer_check_rejected', status_code=400)
        return error(exc, 400)

    return Response({'checked': checked})
@api_view(['GET'])
@permission_classes([AllowAny])
def question_detail(request,question_id):
    q=Question.objects.select_related('exam_part','passage').prefetch_related('options').filter(pk=question_id).first()
    return Response(question_json(q)) if q else error('Không tìm thấy câu hỏi.',404)
@api_view(['GET'])
@permission_classes([AllowAny])
def topic_list(request):return Response([{'id':t.pk,'slug':t.slug,'name':t.name,'count':t.topic_terms.count()} for t in VocabularyTopic.objects.filter(is_published=True).prefetch_related('topic_terms')])
@api_view(['GET'])
@permission_classes([AllowAny])
def topic_detail(request,slug):
    topic=VocabularyTopic.objects.filter(slug=slug,is_published=True).first()
    if not topic:return error('Không tìm thấy chủ đề.',404)
    links=TopicTerm.objects.filter(topic=topic).select_related('term').prefetch_related('term__assets')
    return Response({'id':topic.pk,'slug':topic.slug,'name':topic.name,'words':[term_json(x.term) for x in links]})
@api_view(['GET'])
@permission_classes([AllowAny])
def term_list(request):
    qs=VocabularyTerm.objects.filter(is_active=True).prefetch_related('assets');topic=request.query_params.get('topic');query=request.query_params.get('q','').strip()
    if topic:qs=qs.filter(topic_terms__topic_id=topic)
    if query:qs=qs.filter(word__icontains=query)
    return Response([term_json(x) for x in qs.distinct()[:1000]])
@api_view(['GET'])
@permission_classes([AllowAny])
def term_detail(request,term_id):
    term=VocabularyTerm.objects.prefetch_related('assets').filter(pk=term_id).first()
    return Response(term_json(term)) if term else error('Không tìm thấy từ.',404)

@api_view(['GET'])
def learning_progress(request):
    if not request.user.is_authenticated:return error('Đăng nhập để đồng bộ tiến độ.',401)
    rows=VocabularyProgress.objects.filter(user=request.user)
    quiz_count = VocabularyQuizAttempt.objects.filter(
        user=request.user,
        answers__answered_at__isnull=False,
    ).distinct().count()
    return Response({'learned':rows.filter(status='learned').count(),'review':rows.exclude(status='learned').count(),'seen':sum(rows.values_list('seen_count',flat=True)),'quiz_count':quiz_count})


@api_view(['GET'])
def dashboard_summary(request):
    """Return authenticated learning aggregates used by the dashboard."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để xem thống kê kết quả luyện tập.', 401)

    topics = list(
        VocabularyTopic.objects.filter(is_published=True).prefetch_related('topic_terms')
    )
    quiz_rows = VocabularyQuizAttempt.objects.filter(user=request.user).filter(
        Q(status='submitted') | Q(answers__answered_at__isnull=False),
    ).distinct()
    quiz_answers = VocabularyQuizAnswer.objects.filter(
        attempt__user=request.user,
        answered_at__isnull=False,
    )
    quiz_question_count = quiz_answers.count()
    quiz_correct_count = quiz_answers.filter(is_correct=True).count()

    part_totals = {
        row['part_number']: row['question_count']
        for row in ExamPart.objects.values('part_number').annotate(
            question_count=Sum('question_count'),
        )
    }
    part_score_rows = PartScore.objects.filter(
        attempt__user=request.user,
        attempt__status='submitted',
    ).values('exam_part__part_number').annotate(
        answered_count=Sum('answered_count'),
        correct_count=Sum('correct_count'),
    )
    part_progress = {}
    for row in part_score_rows:
        part_progress[row['exam_part__part_number']] = {
            'answered_count': row['answered_count'] or 0,
            'correct_count': row['correct_count'] or 0,
        }

    parts = []
    for part_number in range(1, 8):
        progress = part_progress.get(part_number, {'answered_count': 0, 'correct_count': 0})
        accuracy = (
            round(progress['correct_count'] / progress['answered_count'] * 100)
            if progress['answered_count']
            else None
        )
        parts.append({
            'part_number': part_number,
            'name': PART_NAMES.get(part_number),
            'question_count': part_totals.get(part_number, 0),
            'answered_count': progress['answered_count'],
            'accuracy': accuracy,
        })

    weak_parts = sorted(
        (part for part in parts if part['accuracy'] is not None),
        key=lambda part: part['accuracy'],
    )[:2]
    submitted_attempts = list(
        TestAttempt.objects.filter(
            user=request.user,
            status='submitted',
            mode='full',
        ).prefetch_related('part_scores__exam_part').order_by('-submitted_at')[:10]
    )
    latest_attempt = submitted_attempts[0] if submitted_attempts else None
    latest_score = (
        full_test_toeic_result(latest_attempt, list(latest_attempt.part_scores.all()))
        if latest_attempt
        else None
    )
    latest_exam = Exam.objects.order_by('-year', '-created_at', 'title').first()

    return Response({
        'parts': parts,
        'vocabulary': {
            'total_count': VocabularyTerm.objects.filter(is_active=True).count(),
            'topic_count': len(topics),
            'quiz_count': quiz_rows.count(),
            'quiz_correct_count': quiz_correct_count,
            'quiz_answered_count': quiz_question_count,
            'quiz_accuracy': round(quiz_correct_count / quiz_question_count * 100)
            if quiz_question_count else None,
        },
        'score': {
            'latest': latest_score,
            'target': 900,
            'target_progress': round(latest_score['total_score'] / 900 * 100)
            if latest_score and latest_score.get('is_valid') else 0,
        },
        'recommendations': [
            {
                'part_number': part['part_number'],
                'name': part['name'],
                'accuracy': part['accuracy'],
            }
            for part in weak_parts
        ],
        'latest_exam': exam_json(latest_exam) if latest_exam else None,
        'submitted_test_count': TestAttempt.objects.filter(
            user=request.user,
            status='submitted',
        ).count(),
        'full_test_count': TestAttempt.objects.filter(
            user=request.user,
            status='submitted',
            mode='full',
        ).count(),
        'part_practice_count': TestAttempt.objects.filter(
            user=request.user,
            status='submitted',
            mode__in=['part', 'subset'],
        ).count(),
    })


@api_view(['GET'])
def study_streak(request):
    """Return the authenticated user's consecutive saved-study days."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để xem chuỗi ngày học.', 401)
    return Response(calculate_study_streak(user=request.user))
@api_view(['GET'])
def vocabulary_progress(request):
    if not request.user.is_authenticated:return error('Đăng nhập để đồng bộ tiến độ.',401)
    rows=VocabularyProgress.objects.filter(user=request.user).select_related('term').prefetch_related('term__assets')
    return Response([{'term':term_json(x.term),'status':x.status,'seen_count':x.seen_count,'wrong_count':x.wrong_count} for x in rows])
def quiz_json(attempt,include_key=False):
    answer_rows = list(
        attempt.answers.select_related('term').prefetch_related('term__assets')
    )
    questions = []
    for row in answer_rows:
        item = {
            'position': row.position,
            'term': term_json(row.term),
            'prompt_type': row.prompt_type,
            'prompt': row.term.meaning_vi if row.prompt_type == 'vi_to_en' else row.term.word,
            'options': row.options_json,
            'selected_value': row.selected_value,
            'is_correct': row.is_correct,
        }
        if include_key or row.is_correct is not None:
            item['correct_value'] = row.correct_value
        questions.append(item)

    answered_count = sum(row.answered_at is not None for row in answer_rows)
    correct_count = sum(
        row.answered_at is not None and row.is_correct is True
        for row in answer_rows
    )
    return {
        'id': attempt.pk,
        'scope': attempt.scope,
        'question_count': attempt.question_count,
        'answered_count': answered_count,
        'correct_count': correct_count,
        'status': attempt.status,
        'questions': questions,
    }
@api_view(['POST'])
def quiz_create(request):
    if not request.user.is_authenticated:return error('Đăng nhập để lưu quiz.',401)
    payload=CreateQuizSerializer(data=request.data)
    if not payload.is_valid():return Response(payload.errors,status=400)
    try:attempt=create_quiz(user=request.user,**payload.validated_data)
    except (ValueError,TypeError):
        log_event(logger, logging.WARNING, 'vocabulary_quiz_creation_failed', service='learning', user_id=request.user.pk, error_code='invalid_quiz_configuration', status_code=400)
        return error('Không thể tạo quiz với cấu hình này.')
    log_event(logger, logging.INFO, 'vocabulary_quiz_created', service='learning', user_id=request.user.pk, resource_id=attempt.pk)
    return Response(quiz_json(attempt),status=201)
def get_quiz(request,attempt_id):return VocabularyQuizAttempt.objects.filter(pk=attempt_id,user=request.user).first()
@api_view(['GET'])
def quiz_detail(request,attempt_id):
    if not request.user.is_authenticated:return error('Đăng nhập để xem quiz.',401)
    attempt=get_quiz(request,attempt_id)
    if not attempt:return error('Không tìm thấy quiz.',404)
    return Response(quiz_json(attempt,attempt.status=='submitted'))
@api_view(['POST'])
def quiz_answer(request,attempt_id):
    if not request.user.is_authenticated:return error('Đăng nhập để lưu câu trả lời.',401)
    attempt=get_quiz(request,attempt_id)
    if not attempt:return error('Không tìm thấy quiz.',404)
    payload=AnswerQuizSerializer(data=request.data)
    if not payload.is_valid():return Response(payload.errors,status=400)
    was_submitted = attempt.status == 'submitted'
    try:row=answer_quiz(attempt=attempt,user=request.user,position=payload.validated_data['position'],selected=payload.validated_data['selected_value'])
    except PermissionError:
        log_event(logger, logging.WARNING, 'vocabulary_quiz_answer_failed', service='learning', user_id=request.user.pk, resource_id=attempt.pk, error_code='quiz_not_writable', status_code=403)
        return error('Quiz không thể nhận câu trả lời.',403)
    except (KeyError,ValueError):
        log_event(logger, logging.WARNING, 'vocabulary_quiz_answer_failed', service='learning', user_id=request.user.pk, resource_id=attempt.pk, error_code='invalid_answer_position', status_code=400)
        return error('Câu trả lời không hợp lệ.')
    if not was_submitted and row.attempt.status == 'submitted':
        log_event(logger, logging.INFO, 'vocabulary_quiz_submitted', service='learning', user_id=request.user.pk, resource_id=attempt.pk)
    return Response({'position':row.position,'selected_value':row.selected_value,'is_correct':row.is_correct,'correct_value':row.correct_value,'status':row.attempt.status,'correct_count':row.attempt.correct_count,'question_count':row.attempt.question_count,'answered_count':row.attempt.answers.filter(answered_at__isnull=False).count()})
@api_view(['POST'])
def quiz_submit(request,attempt_id):
    if not request.user.is_authenticated:return error('Đăng nhập để nộp quiz.',401)
    attempt=get_quiz(request,attempt_id)
    if not attempt:return error('Không tìm thấy quiz.',404)
    was_submitted = attempt.status == 'submitted'
    try:attempt=submit_quiz(attempt=attempt,user=request.user)
    except PermissionError:
        log_event(logger, logging.WARNING, 'vocabulary_quiz_submission_failed', service='learning', user_id=request.user.pk, resource_id=attempt.pk, error_code='quiz_not_submittable', status_code=403)
        return error('Quiz không thể nộp.',403)
    if not was_submitted and attempt.status == 'submitted':
        log_event(logger, logging.INFO, 'vocabulary_quiz_submitted', service='learning', user_id=request.user.pk, resource_id=attempt.pk)
    return Response(quiz_json(attempt,True))
@api_view(['GET'])
def quiz_result(request,attempt_id):
    """Return a completed quiz with its answer key for the result screen."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để xem kết quả quiz.',401)
    attempt=get_quiz(request,attempt_id)
    if not attempt:
        return error('Không tìm thấy quiz.',404)
    if attempt.status != 'submitted':
        return error('Quiz chưa hoàn thành.',409)
    return Response(quiz_json(attempt,True))
@api_view(['GET'])
def quiz_history(request):
    if not request.user.is_authenticated:return error('Đăng nhập để xem lịch sử.',401)
    rows = VocabularyQuizAttempt.objects.filter(user=request.user).annotate(
        answered_count=Count(
            'answers',
            filter=Q(answers__answered_at__isnull=False),
        ),
        answered_correct_count=Count(
            'answers',
            filter=Q(
                answers__answered_at__isnull=False,
                answers__is_correct=True,
            ),
        ),
    ).order_by('-started_at')[:100]
    return Response([
        {
            'id': attempt.pk,
            'scope': attempt.scope,
            'question_count': attempt.question_count,
            'answered_count': attempt.answered_count,
            'correct_count': attempt.answered_correct_count,
            'status': attempt.status,
            'started_at': attempt.started_at,
            'submitted_at': attempt.submitted_at,
        }
        for attempt in rows
    ])

def attempt_json(attempt,include_answers=False):
    qs=attempt.answers.select_related('question__exam_part','question__passage').prefetch_related('question__options').order_by('question__exam_part__part_number','question__number');items=[]
    for answer in qs:
        q=question_json(answer.question,include_answers or attempt.status=='submitted');q.update({'selected_answer':answer.selected_option,'is_correct':answer.is_correct});items.append(q)
    selected_part_numbers = attempt.selected_parts.values_list('exam_part__part_number', flat=True)
    directions = [
        {
            'part_number': direction.part_number,
            'title': direction.title,
            'direction_html': direction.direction_html,
            'image': asset_url(direction.image_path) if direction.image_path else '',
            'example_html': direction.example_html,
        }
        for direction in Direction.objects.filter(part_number__in=selected_part_numbers)
    ]
    return {'id':str(attempt.pk),'exam':exam_json(attempt.exam),'mode':attempt.mode,'status':attempt.status,'time_limit_seconds':attempt.time_limit_seconds,'started_at':attempt.started_at,'exam_started_at':attempt.exam_started_at,'submitted_at':attempt.submitted_at,'current_question_index':attempt.current_question_index,'directions':directions,'questions':items,**attempt_time_state(attempt)}
def part_score_json(attempt):
    """Serialize per-part scores and the full-test TOEIC estimate."""
    scores=list(attempt.part_scores.select_related('exam_part'))
    return {
        'part_scores':[{'part_number':s.exam_part.part_number,'title':s.exam_part.title,'answered_count':s.answered_count,'scored_count':s.scored_count,'correct_count':s.correct_count,'score_percent':s.score_percent} for s in scores],
        'toeic_score':full_test_toeic_result(attempt,scores),
    }
def get_attempt(request,attempt_id):
    attempt=TestAttempt.objects.select_related('exam').filter(pk=attempt_id).first()
    if attempt and attempt.user_id != getattr(request.user,'id',None):return None
    return attempt
@api_view(['POST'])
def attempt_create(request):
    if not request.user.is_authenticated:
        return error('Đăng nhập để bắt đầu làm bài thi.', 401)
    payload=StartAttemptSerializer(data=request.data)
    if not payload.is_valid():return Response(payload.errors,status=400)
    try:attempt=start_attempt(user=request.user,**payload.validated_data)
    except ActiveFullTestExists as exc:
        attempt = exc.attempt
        log_event(logger, logging.WARNING, 'test_attempt_creation_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='active_full_test_exists', status_code=409)
        return Response(
            {
                'code': 'active_full_test_exists',
                'message': str(exc),
                'active_attempt': {
                    'id': str(attempt.pk),
                    'exam_id': attempt.exam.external_id,
                    'exam_title': attempt.exam.title,
                    'exam_slug': attempt.exam.slug,
                    'current_question_index': attempt.current_question_index,
                    'answered_count': attempt.answers.filter(
                        selected_option__gt=''
                    ).count(),
                    **attempt_time_state(attempt),
                },
            },
            status=409,
        )
    except (ValueError,TypeError,Exam.DoesNotExist):
        log_event(logger, logging.WARNING, 'test_attempt_creation_failed', service='assessment', user_id=request.user.pk, error_code='invalid_attempt_request', status_code=400)
        return error('Không thể tạo lượt thi với yêu cầu này.')
    log_event(logger, logging.INFO, 'test_attempt_created', service='assessment', user_id=request.user.pk, resource_id=attempt.pk)
    return Response(attempt_json(attempt),status=201)
@api_view(['GET'])
def attempt_detail(request,attempt_id):
    if not request.user.is_authenticated:
        return error('Đăng nhập để tiếp tục bài thi.', 401)
    attempt=get_attempt(request,attempt_id)
    if attempt and attempt.status != 'in_progress':
        return error('Phiên thi này đã kết thúc hoặc bị hủy.', 409)
    return Response(attempt_json(attempt)) if attempt else error('Không tìm thấy bài thi.',404)

@api_view(['POST'])
@transaction.atomic
def attempt_start(request,attempt_id):
    """Start the actual timed test only after the learner confirms directions."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để bắt đầu bài thi.', 401)
    attempt = TestAttempt.objects.select_for_update().filter(pk=attempt_id).first()
    if not attempt or attempt.user_id != request.user.id:
        return error('Không tìm thấy bài thi.', 404)
    if attempt.status != 'in_progress':
        return error('Bài thi này đã kết thúc.', 409)
    if attempt.mode != 'full':
        return error('Chức năng bắt đầu riêng chỉ áp dụng cho full test.', 400)
    if attempt.exam_started_at is None:
        attempt.exam_started_at = timezone.now()
        attempt.save(update_fields=['exam_started_at', 'last_activity_at'])
        log_event(logger, logging.INFO, 'test_attempt_started', service='assessment', user_id=request.user.pk, resource_id=attempt.pk)
    return Response(attempt_json(attempt))


@api_view(['PUT'])
def attempt_progress(request, attempt_id):
    """Persist the current full-test question position for session resumption."""
    if not request.user.is_authenticated:
        return error('Đăng nhập để lưu tiến độ bài thi.', 401)
    attempt = get_attempt(request, attempt_id)
    if not attempt:
        return error('Không tìm thấy bài thi.', 404)

    payload = AttemptProgressSerializer(data=request.data)
    if not payload.is_valid():
        return Response(payload.errors, status=400)

    try:
        attempt = save_attempt_progress(
            attempt_id=attempt_id,
            user=request.user,
            **payload.validated_data,
        )
    except PermissionError as exc:
        log_event(logger, logging.WARNING, 'test_attempt_progress_save_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='progress_forbidden', status_code=403)
        return error(exc, 403)
    except ValueError as exc:
        log_event(logger, logging.ERROR, 'test_attempt_progress_save_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='progress_save_rejected', status_code=409)
        return error(exc, 409)

    return Response({'current_question_index': attempt.current_question_index})
@api_view(['PUT'])
def attempt_answers(request,attempt_id):
    if not request.user.is_authenticated:
        return error('Đăng nhập để lưu câu trả lời.', 401)
    attempt=get_attempt(request,attempt_id)
    if not attempt:return error('Không tìm thấy bài thi.',404)
    payload=SaveAnswersSerializer(data=request.data)
    if not payload.is_valid():return Response(payload.errors,status=400)
    values=payload.validated_data['answers']
    try:save_answers(attempt=attempt,user=request.user,answers=values)
    except (ValueError,TypeError):
        log_event(logger, logging.ERROR, 'test_attempt_answers_save_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='answers_save_failed', status_code=400)
        return error('Không thể lưu câu trả lời.')
    if payload.validated_data['check']:
        rows=TestAnswer.objects.filter(attempt=attempt,question_id__in=values.keys()).select_related('question')
        return Response({'saved':len(values),'checked':[{'question_id':x.question_id,'selected_answer':x.selected_option,'correct_answer':x.question.correct_option,'is_correct':bool(x.question.correct_option and x.selected_option==x.question.correct_option),'explanation':{'reason':x.question.explanation_reason,'tip':x.question.explanation_tip}} for x in rows]})
    return Response({'saved':len(values)})
@api_view(['POST'])
def attempt_submit(request,attempt_id):
    if not request.user.is_authenticated:
        return error('Đăng nhập để nộp bài thi.', 401)
    attempt=get_attempt(request,attempt_id)
    if not attempt:return error('Không tìm thấy bài thi.',404)
    was_submitted = attempt.status == 'submitted'
    try:attempt=submit_attempt(attempt_id=attempt_id,user=request.user)
    except PermissionError:
        log_event(logger, logging.WARNING, 'test_attempt_submission_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='submission_forbidden', status_code=403)
        return error('Không thể nộp lượt thi.',403)
    except ValueError:
        log_event(logger, logging.WARNING, 'test_attempt_submission_failed', service='assessment', user_id=request.user.pk, resource_id=attempt.pk, error_code='submission_rejected', status_code=409)
        return error('Lượt thi không thể nộp ở trạng thái hiện tại.',409)
    if not was_submitted:
        log_event(logger, logging.INFO, 'test_attempt_submitted', service='assessment', user_id=request.user.pk, resource_id=attempt.pk)
    return Response({'attempt':attempt_json(attempt,True),**part_score_json(attempt)})
@api_view(['POST'])
def attempt_abandon(request,attempt_id):
    if not request.user.is_authenticated:
        return error('Đăng nhập để cập nhật bài thi.', 401)
    attempt=get_attempt(request,attempt_id)
    if not attempt:return error('Không tìm thấy bài thi.',404)
    if attempt.status=='in_progress':
        attempt.status='abandoned'
        attempt.save(update_fields=['status', 'last_activity_at'])
        log_event(logger, logging.INFO, 'test_attempt_abandoned', service='assessment', user_id=request.user.pk, resource_id=attempt.pk)
    return Response({'status':attempt.status})
@api_view(['GET'])
def attempt_result(request,attempt_id):return attempt_review(request,attempt_id)
@api_view(['GET'])
def attempt_review(request,attempt_id):
    if not request.user.is_authenticated:
        return error('Đăng nhập để xem kết quả bài thi.', 401)
    attempt=get_attempt(request,attempt_id)
    if not attempt:return error('Không tìm thấy bài thi.',404)
    if attempt.status!='submitted':return error('Nộp bài trước khi xem kết quả và đáp án.',409)
    return Response({'attempt':attempt_json(attempt,True),**part_score_json(attempt)})
@api_view(['GET'])
def assessment_history(request):
    if not request.user.is_authenticated:
        return error('Đăng nhập để xem lịch sử bài thi.', 401)
    rows=TestAttempt.objects.filter(user=request.user).select_related('exam').prefetch_related('part_scores__exam_part').order_by('-started_at')[:100]
    history=[]
    for attempt in rows:
        history.append({'id':str(attempt.pk),'exam_id':attempt.exam.external_id,'exam_slug':attempt.exam.slug,'exam_title':attempt.exam.title,'mode':attempt.mode,'status':attempt.status,'started_at':attempt.started_at,'submitted_at':attempt.submitted_at,'part_scores':[{'part_number':score.exam_part.part_number,'correct_count':score.correct_count,'scored_count':score.scored_count,'score_percent':score.score_percent} for score in attempt.part_scores.all()]})
    return Response(history)

@api_view(['GET'])
@permission_classes([AllowAny])
def grammar_list(request):return Response(list(GrammarNote.objects.filter(is_published=True).values('id','title','body','quick_rule','example')))
@api_view(['GET'])
@permission_classes([AllowAny])
def grammar_detail(request,note_id):
    note=GrammarNote.objects.filter(pk=note_id,is_published=True).first()
    return Response({'id':note.pk,'title':note.title,'body':note.body,'quick_rule':note.quick_rule,'example':note.example}) if note else error('Không tìm thấy nội dung.',404)
@api_view(['GET'])
@permission_classes([AllowAny])
def tips_list(request):return Response(list(PartTip.objects.filter(is_published=True).values('id','part_number','title','body')))
@api_view(['GET'])
@permission_classes([AllowAny])
def articles_list(request):return Response(list(KnowledgeArticle.objects.filter(is_published=True).values('id','title','url','source_name')))
