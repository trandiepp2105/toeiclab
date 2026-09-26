-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: toeiclab
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `knowledge_grammarnote`
--

LOCK TABLES `knowledge_grammarnote` WRITE;
/*!40000 ALTER TABLE `knowledge_grammarnote` DISABLE KEYS */;
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (1,'Thì hiện tại đơn','Dùng cho lịch trình, sự thật và thói quen. Trong Part 5, chú ý chủ ngữ số ít thêm -s/-es.','Dùng cho lịch trình, sự thật và thói quen. Trong Part 5, chú ý chủ ngữ số ít thêm -s/-es.','He works in the accounting department.',1,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (2,'Thì quá khứ đơn','Dùng cho hành động đã kết thúc tại một thời điểm trong quá khứ; nhận diện yesterday, last, ago.','Dùng cho hành động đã kết thúc tại một thời điểm trong quá khứ; nhận diện yesterday, last, ago.','The manager approved the request yesterday.',2,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (3,'Thì hiện tại hoàn thành','Have/has + past participle; thường đi với since, for, already, yet hoặc kết quả còn liên quan hiện tại.','Have/has + past participle; thường đi với since, for, already, yet hoặc kết quả còn liên quan hiện tại.','We have received your application.',3,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (4,'Sự hòa hợp chủ ngữ – động từ','Xác định chủ ngữ chính, bỏ qua cụm giới từ chen giữa. Each/every và danh từ không đếm được thường đi với động từ số ít.','Xác định chủ ngữ chính, bỏ qua cụm giới từ chen giữa. Each/every và danh từ không đếm được thường đi với động từ số ít.','Each of the invoices is ready.',4,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (5,'Loại từ và vị trí','Trước danh từ thường là tính từ; sau động từ nối thường là tính từ; trạng từ bổ nghĩa động từ, tính từ hoặc cả câu.','Trước danh từ thường là tính từ; sau động từ nối thường là tính từ; trạng từ bổ nghĩa động từ, tính từ hoặc cả câu.','The proposal was carefully reviewed.',5,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (6,'Mệnh đề quan hệ','Who thay người, which thay vật, that có thể thay cả hai trong mệnh đề xác định; whose diễn tả sở hữu.','Who thay người, which thay vật, that có thể thay cả hai trong mệnh đề xác định; whose diễn tả sở hữu.','The consultant who joined us is from Seoul.',6,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (7,'Liên từ và mệnh đề','Because/although/while nối mệnh đề; because of/despite đi với cụm danh từ hoặc V-ing.','Because/although/while nối mệnh đề; because of/despite đi với cụm danh từ hoặc V-ing.','Although sales increased, costs remained stable.',7,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (8,'Động từ nguyên mẫu và V-ing','Một số động từ theo sau bởi to + V; một số theo sau bởi V-ing. Ghi nhớ cấu trúc đi cùng động từ thay vì dịch từng từ.','Một số động từ theo sau bởi to + V; một số theo sau bởi V-ing. Ghi nhớ cấu trúc đi cùng động từ thay vì dịch từng từ.','They plan to expand the branch.',8,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (9,'Giới từ thời gian','At + giờ; on + ngày; in + tháng/năm/khoảng thời gian. By diễn tả hạn chót, until diễn tả thời điểm kết thúc.','At + giờ; on + ngày; in + tháng/năm/khoảng thời gian. By diễn tả hạn chót, until diễn tả thời điểm kết thúc.','Please submit the form by Friday.',9,1);
INSERT INTO `knowledge_grammarnote` (`id`, `title`, `body`, `quick_rule`, `example`, `sort_order`, `is_published`) VALUES (10,'Câu bị động','Be + past participle; dùng khi nhấn mạnh hành động/kết quả hoặc không nêu người thực hiện.','Be + past participle; dùng khi nhấn mạnh hành động/kết quả hoặc không nêu người thực hiện.','The conference room is being renovated.',10,1);
/*!40000 ALTER TABLE `knowledge_grammarnote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `knowledge_parttip`
--

LOCK TABLES `knowledge_parttip` WRITE;
/*!40000 ALTER TABLE `knowledge_parttip` DISABLE KEYS */;
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (1,1,'Nhìn tổng thể trước khi nghe','Xem nhanh bốn lựa chọn và xác định chúng khác nhau ở người, hành động hay địa điểm. Không suy đoán quá xa từ một chi tiết nhỏ.',1,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (2,2,'Nghe ý chính, không dịch từng từ','Câu trả lời thường là phản hồi tự nhiên, không lặp nguyên từ khóa trong câu hỏi. Chú ý từ để hỏi who/where/when/why/how.',2,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (3,3,'Theo dõi lượt nói và từ nối','Ghi nhận ai đang nói, vấn đề gì và mục đích cuộc trò chuyện. Chú ý however, actually, so và các lời đề nghị.',3,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (4,4,'Đọc câu hỏi trước khi nghe','Dự đoán thông tin cần tìm như địa điểm, thời gian hoặc mục đích. Câu hỏi thường đi theo thứ tự nội dung bài nói.',4,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (5,5,'Nhận diện cấu trúc câu','Xác định loại từ cần điền bằng vị trí chỗ trống và cấu trúc xung quanh trước khi xét nghĩa.',5,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (6,6,'Đọc cả đoạn văn','Đọc câu trước và sau chỗ trống để kiểm tra liên kết ý, đại từ, từ nối và dạng từ; không chỉ nhìn một câu riêng lẻ.',6,1);
INSERT INTO `knowledge_parttip` (`id`, `part_number`, `title`, `body`, `sort_order`, `is_published`) VALUES (7,7,'Đọc câu hỏi trước, định vị sau','Dùng từ khóa và từ đồng nghĩa để tìm đoạn chứa đáp án. Với bài đôi/ba, nối thông tin giữa các tài liệu và kiểm tra danh tính người nói.',7,1);
/*!40000 ALTER TABLE `knowledge_parttip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `knowledge_knowledgearticle`
--

LOCK TABLES `knowledge_knowledgearticle` WRITE;
/*!40000 ALTER TABLE `knowledge_knowledgearticle` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_knowledgearticle` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-23 17:39:59
