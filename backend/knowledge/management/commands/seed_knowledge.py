"""Create curated starter grammar notes and tips, preserving admin edits."""
from django.core.management.base import BaseCommand
from knowledge.models import GrammarNote,PartTip

GRAMMAR=[
 ('Thì hiện tại đơn','Dùng cho lịch trình, sự thật và thói quen. Trong Part 5, chú ý chủ ngữ số ít thêm -s/-es.','He works in the accounting department.'),
 ('Thì quá khứ đơn','Dùng cho hành động đã kết thúc tại một thời điểm trong quá khứ; nhận diện yesterday, last, ago.','The manager approved the request yesterday.'),
 ('Thì hiện tại hoàn thành','Have/has + past participle; thường đi với since, for, already, yet hoặc kết quả còn liên quan hiện tại.','We have received your application.'),
 ('Sự hòa hợp chủ ngữ – động từ','Xác định chủ ngữ chính, bỏ qua cụm giới từ chen giữa. Each/every và danh từ không đếm được thường đi với động từ số ít.','Each of the invoices is ready.'),
 ('Loại từ và vị trí','Trước danh từ thường là tính từ; sau động từ nối thường là tính từ; trạng từ bổ nghĩa động từ, tính từ hoặc cả câu.','The proposal was carefully reviewed.'),
 ('Mệnh đề quan hệ','Who thay người, which thay vật, that có thể thay cả hai trong mệnh đề xác định; whose diễn tả sở hữu.','The consultant who joined us is from Seoul.'),
 ('Liên từ và mệnh đề','Because/although/while nối mệnh đề; because of/despite đi với cụm danh từ hoặc V-ing.','Although sales increased, costs remained stable.'),
 ('Động từ nguyên mẫu và V-ing','Một số động từ theo sau bởi to + V; một số theo sau bởi V-ing. Ghi nhớ cấu trúc đi cùng động từ thay vì dịch từng từ.','They plan to expand the branch.'),
 ('Giới từ thời gian','At + giờ; on + ngày; in + tháng/năm/khoảng thời gian. By diễn tả hạn chót, until diễn tả thời điểm kết thúc.','Please submit the form by Friday.'),
 ('Câu bị động','Be + past participle; dùng khi nhấn mạnh hành động/kết quả hoặc không nêu người thực hiện.','The conference room is being renovated.'),
]
TIPS=[
 ('Nhìn tổng thể trước khi nghe','Xem nhanh bốn lựa chọn và xác định chúng khác nhau ở người, hành động hay địa điểm. Không suy đoán quá xa từ một chi tiết nhỏ.'),
 ('Nghe ý chính, không dịch từng từ','Câu trả lời thường là phản hồi tự nhiên, không lặp nguyên từ khóa trong câu hỏi. Chú ý từ để hỏi who/where/when/why/how.'),
 ('Theo dõi lượt nói và từ nối','Ghi nhận ai đang nói, vấn đề gì và mục đích cuộc trò chuyện. Chú ý however, actually, so và các lời đề nghị.'),
 ('Đọc câu hỏi trước khi nghe','Dự đoán thông tin cần tìm như địa điểm, thời gian hoặc mục đích. Câu hỏi thường đi theo thứ tự nội dung bài nói.'),
 ('Nhận diện cấu trúc câu','Xác định loại từ cần điền bằng vị trí chỗ trống và cấu trúc xung quanh trước khi xét nghĩa.'),
 ('Đọc cả đoạn văn','Đọc câu trước và sau chỗ trống để kiểm tra liên kết ý, đại từ, từ nối và dạng từ; không chỉ nhìn một câu riêng lẻ.'),
 ('Đọc câu hỏi trước, định vị sau','Dùng từ khóa và từ đồng nghĩa để tìm đoạn chứa đáp án. Với bài đôi/ba, nối thông tin giữa các tài liệu và kiểm tra danh tính người nói.'),
]
class Command(BaseCommand):
    help='Seed starter TOEIC grammar and part strategy content idempotently.'
    def handle(self,*args,**options):
        for i,(title,body,example) in enumerate(GRAMMAR,1):GrammarNote.objects.get_or_create(title=title,defaults={'body':body,'quick_rule':body,'example':example,'sort_order':i})
        for i,(title,body) in enumerate(TIPS,1):PartTip.objects.get_or_create(part_number=i,defaults={'title':title,'body':body,'sort_order':i})
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(GRAMMAR)} grammar notes and {len(TIPS)} part tips.'))
