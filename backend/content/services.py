"""Read and import examination-bank entities."""
import hashlib, re, json
from pathlib import Path
from django.db import transaction
from django.utils.text import slugify
from .models import Exam, ExamPart, Passage, Question, QuestionOption, ContentAsset, QuestionAsset, PassageAsset

PART_TITLES={1:'Mô tả hình ảnh',2:'Hỏi – đáp',3:'Đoạn hội thoại',4:'Bài nói ngắn',5:'Hoàn thành câu',6:'Hoàn thành đoạn văn',7:'Đọc hiểu'}

def exam_title(payload, fallback):
    counts={}
    for q in payload.get('questions',[]):
        stem=re.split(r'\.\s*Part\s+[1-7]',q.get('question',''),maxsplit=1)[0].strip(' .')
        if stem and stem.lower() not in {f'part {n}' for n in range(1,8)}: counts[stem]=counts.get(stem,0)+1
    return max(counts,key=counts.get) if counts else (payload.get('title') if payload.get('title','').lower()!='part 1' else f'TOEIC Test {fallback}')


def exam_year(payload):
    """Return the publication year inferred from the source metadata.

    Most source URLs contain an explicit year.  Hacker 2/3 files do not, but
    belong to the 2025 source collection used by this application.
    """
    source_text = ' '.join(
        str(payload.get(key, '')) for key in ('title', 'source_url')
    )
    year_match = re.search(r'(?<!\d)(20\d{2})(?!\d)', source_text)
    if year_match:
        return int(year_match.group(1))

    source_text = source_text.lower()
    if 'test-dau-vao' in source_text:
        return 2023
    if 'hacker-2' in source_text or 'hacker-3' in source_text:
        return 2025
    return None


def exam_slug(payload, external_id, year=None):
    """Create a stable, readable and unique URL slug for an exam."""
    title = payload.get('normalized_title') or payload.get('title') or f'TOEIC Test {external_id}'
    base = slugify(f'{title}-{year or external_id}')
    return (base or f'exam-{external_id}')[:180]

@transaction.atomic
def import_exam_file(path):
    """Idempotently import one test JSON while preserving source payloads."""
    data=json.loads(Path(path).read_text(encoding='utf-8')); external_id=str(data.get('id',Path(path).parent.name)); questions=data.get('questions',[])
    answer_count=sum(bool(q.get('correct_answer')) for q in questions)
    year = exam_year(data)
    title = exam_title(data, external_id)
    slug_payload = {**data, 'normalized_title': title}
    exam,_=Exam.objects.update_or_create(external_id=external_id,defaults={'title':title,'source_url':data.get('source_url',''),'year':year,'slug':exam_slug(slug_payload,external_id,year),'time_limit_seconds':data.get('time_limit_seconds') or 7200,'question_count':len(questions),'answer_count':answer_count,'source_payload':{k:v for k,v in data.items() if k!='questions'}})
    parts={}
    for q in questions:
        pn=int(q.get('part_number') or 1); part=parts.get(pn)
        if not part:
            part,_=ExamPart.objects.update_or_create(exam=exam,part_number=pn,defaults={'title':PART_TITLES.get(pn,f'Part {pn}'),'question_count':sum(int(x.get('part_number') or 1)==pn for x in questions)})
            parts[pn]=part
        passage=None
        if pn in (6,7):
            html=q.get('content_html') or ''; raw=html+'|'+(q.get('transcript') or '')
            key=hashlib.sha1(raw.encode()).hexdigest()[:32] if html or q.get('transcript') else f'question-{q.get("number")}'
            passage,_=Passage.objects.get_or_create(exam_part=part,source_key=key,defaults={'content_html':html,'transcript':q.get('transcript',''),'sort_order':int(q.get('number') or 0),'assets':q.get('image_files',[])})
        exp=q.get('explanation') or {}; reason=exp.get('reason','') if isinstance(exp,dict) else str(exp)
        obj,_=Question.objects.update_or_create(exam_part=part,number=int(q.get('number') or 1),defaults={'passage':passage,'external_question_id':str(q.get('question_id') or ''),'title':q.get('title',''),'prompt':q.get('question','') or '', 'prompt_html':q.get('content_html',''),'correct_option':(q.get('correct_answer') or None),'explanation_reason':reason,'explanation_tip':(exp.get('tip') or '') if isinstance(exp,dict) else '', 'transcript':q.get('transcript',''),'transcript_source':q.get('transcript_source',''),'media':{'audio':q.get('audio_files',[]),'images':q.get('image_files',[]),'audio_url':q.get('audio_url',''),'image_urls':q.get('image_urls',[])},'source_payload':q})
        QuestionOption.objects.filter(question=obj).delete()
        QuestionOption.objects.bulk_create([QuestionOption(question=obj,option_key=str(k).strip('.').upper()[:1],answer_text=str(v)) for k,v in (q.get('options') or {}).items() if str(k).strip('.').upper()[:1] in 'ABCD'])
        QuestionAsset.objects.filter(question=obj).delete()
        for role,key in [('audio','audio_files'),('image','image_files')]:
            for order,relative in enumerate(q.get(key,[])):
                stored=f'zenlish_data/{relative}'
                asset,_=ContentAsset.objects.update_or_create(asset_type=role,storage_path=stored,defaults={'source_url':'','metadata':{'external_id':q.get('question_id')}})
                QuestionAsset.objects.get_or_create(question=obj,asset=asset,role=role,defaults={'sort_order':order})
                if passage:PassageAsset.objects.get_or_create(passage=passage,asset=asset,role=role,defaults={'sort_order':order})
    return exam
