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
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (1,'admin','logentry');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (24,'assessments','attemptpart');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (25,'assessments','partscore');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (26,'assessments','testanswer');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (27,'assessments','testattempt');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (2,'auth','group');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (3,'auth','permission');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (9,'content','contentasset');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (10,'content','exam');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (11,'content','exampart');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (12,'content','passage');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (13,'content','passageasset');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (14,'content','question');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (15,'content','questionasset');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (16,'content','questionoption');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (4,'contenttypes','contenttype');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (28,'knowledge','grammarnote');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (29,'knowledge','knowledgearticle');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (30,'knowledge','parttip');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (21,'learning','vocabularyprogress');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (22,'learning','vocabularyquizanswer');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (23,'learning','vocabularyquizattempt');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (5,'sessions','session');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (6,'users','authidentity');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (7,'users','otpchallenge');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (8,'users','user');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (17,'vocabulary','termasset');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (18,'vocabulary','topicterm');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (19,'vocabulary','vocabularyterm');
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES (20,'vocabulary','vocabularytopic');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (1,'Can add log entry',1,'add_logentry');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (2,'Can change log entry',1,'change_logentry');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (3,'Can delete log entry',1,'delete_logentry');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (4,'Can view log entry',1,'view_logentry');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (5,'Can add permission',3,'add_permission');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (6,'Can change permission',3,'change_permission');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (7,'Can delete permission',3,'delete_permission');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (8,'Can view permission',3,'view_permission');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (9,'Can add group',2,'add_group');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (10,'Can change group',2,'change_group');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (11,'Can delete group',2,'delete_group');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (12,'Can view group',2,'view_group');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (13,'Can add content type',4,'add_contenttype');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (14,'Can change content type',4,'change_contenttype');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (15,'Can delete content type',4,'delete_contenttype');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (16,'Can view content type',4,'view_contenttype');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (17,'Can add session',5,'add_session');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (18,'Can change session',5,'change_session');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (19,'Can delete session',5,'delete_session');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (20,'Can view session',5,'view_session');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (21,'Can add otp challenge',7,'add_otpchallenge');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (22,'Can change otp challenge',7,'change_otpchallenge');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (23,'Can delete otp challenge',7,'delete_otpchallenge');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (24,'Can view otp challenge',7,'view_otpchallenge');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (25,'Can add user',8,'add_user');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (26,'Can change user',8,'change_user');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (27,'Can delete user',8,'delete_user');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (28,'Can view user',8,'view_user');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (29,'Can add auth identity',6,'add_authidentity');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (30,'Can change auth identity',6,'change_authidentity');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (31,'Can delete auth identity',6,'delete_authidentity');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (32,'Can view auth identity',6,'view_authidentity');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (33,'Can add content asset',9,'add_contentasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (34,'Can change content asset',9,'change_contentasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (35,'Can delete content asset',9,'delete_contentasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (36,'Can view content asset',9,'view_contentasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (37,'Can add exam',10,'add_exam');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (38,'Can change exam',10,'change_exam');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (39,'Can delete exam',10,'delete_exam');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (40,'Can view exam',10,'view_exam');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (41,'Can add exam part',11,'add_exampart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (42,'Can change exam part',11,'change_exampart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (43,'Can delete exam part',11,'delete_exampart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (44,'Can view exam part',11,'view_exampart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (45,'Can add passage',12,'add_passage');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (46,'Can change passage',12,'change_passage');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (47,'Can delete passage',12,'delete_passage');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (48,'Can view passage',12,'view_passage');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (49,'Can add question',14,'add_question');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (50,'Can change question',14,'change_question');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (51,'Can delete question',14,'delete_question');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (52,'Can view question',14,'view_question');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (53,'Can add question option',16,'add_questionoption');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (54,'Can change question option',16,'change_questionoption');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (55,'Can delete question option',16,'delete_questionoption');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (56,'Can view question option',16,'view_questionoption');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (57,'Can add passage asset',13,'add_passageasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (58,'Can change passage asset',13,'change_passageasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (59,'Can delete passage asset',13,'delete_passageasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (60,'Can view passage asset',13,'view_passageasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (61,'Can add question asset',15,'add_questionasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (62,'Can change question asset',15,'change_questionasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (63,'Can delete question asset',15,'delete_questionasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (64,'Can view question asset',15,'view_questionasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (65,'Can add vocabulary term',19,'add_vocabularyterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (66,'Can change vocabulary term',19,'change_vocabularyterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (67,'Can delete vocabulary term',19,'delete_vocabularyterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (68,'Can view vocabulary term',19,'view_vocabularyterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (69,'Can add vocabulary topic',20,'add_vocabularytopic');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (70,'Can change vocabulary topic',20,'change_vocabularytopic');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (71,'Can delete vocabulary topic',20,'delete_vocabularytopic');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (72,'Can view vocabulary topic',20,'view_vocabularytopic');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (73,'Can add term asset',17,'add_termasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (74,'Can change term asset',17,'change_termasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (75,'Can delete term asset',17,'delete_termasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (76,'Can view term asset',17,'view_termasset');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (77,'Can add topic term',18,'add_topicterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (78,'Can change topic term',18,'change_topicterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (79,'Can delete topic term',18,'delete_topicterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (80,'Can view topic term',18,'view_topicterm');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (81,'Can add vocabulary quiz answer',22,'add_vocabularyquizanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (82,'Can change vocabulary quiz answer',22,'change_vocabularyquizanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (83,'Can delete vocabulary quiz answer',22,'delete_vocabularyquizanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (84,'Can view vocabulary quiz answer',22,'view_vocabularyquizanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (85,'Can add vocabulary quiz attempt',23,'add_vocabularyquizattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (86,'Can change vocabulary quiz attempt',23,'change_vocabularyquizattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (87,'Can delete vocabulary quiz attempt',23,'delete_vocabularyquizattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (88,'Can view vocabulary quiz attempt',23,'view_vocabularyquizattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (89,'Can add vocabulary progress',21,'add_vocabularyprogress');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (90,'Can change vocabulary progress',21,'change_vocabularyprogress');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (91,'Can delete vocabulary progress',21,'delete_vocabularyprogress');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (92,'Can view vocabulary progress',21,'view_vocabularyprogress');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (93,'Can add attempt part',24,'add_attemptpart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (94,'Can change attempt part',24,'change_attemptpart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (95,'Can delete attempt part',24,'delete_attemptpart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (96,'Can view attempt part',24,'view_attemptpart');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (97,'Can add part score',25,'add_partscore');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (98,'Can change part score',25,'change_partscore');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (99,'Can delete part score',25,'delete_partscore');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (100,'Can view part score',25,'view_partscore');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (101,'Can add test answer',26,'add_testanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (102,'Can change test answer',26,'change_testanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (103,'Can delete test answer',26,'delete_testanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (104,'Can view test answer',26,'view_testanswer');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (105,'Can add test attempt',27,'add_testattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (106,'Can change test attempt',27,'change_testattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (107,'Can delete test attempt',27,'delete_testattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (108,'Can view test attempt',27,'view_testattempt');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (109,'Can add grammar note',28,'add_grammarnote');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (110,'Can change grammar note',28,'change_grammarnote');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (111,'Can delete grammar note',28,'delete_grammarnote');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (112,'Can view grammar note',28,'view_grammarnote');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (113,'Can add knowledge article',29,'add_knowledgearticle');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (114,'Can change knowledge article',29,'change_knowledgearticle');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (115,'Can delete knowledge article',29,'delete_knowledgearticle');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (116,'Can view knowledge article',29,'view_knowledgearticle');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (117,'Can add part tip',30,'add_parttip');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (118,'Can change part tip',30,'change_parttip');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (119,'Can delete part tip',30,'delete_parttip');
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES (120,'Can view part tip',30,'view_parttip');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
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
