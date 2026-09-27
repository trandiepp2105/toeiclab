-- Generated native MySQL schema for TOEIC Lab.
SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE IF NOT EXISTS django_migrations (id bigint NOT NULL AUTO_INCREMENT, app varchar(255) NOT NULL, name varchar(255) NOT NULL, applied datetime(6) NOT NULL, PRIMARY KEY (id), UNIQUE KEY django_migrations_app_name (app,name));
--
-- Create model ContentType
--
CREATE TABLE `django_content_type` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(100) NOT NULL, `app_label` varchar(100) NOT NULL, `model` varchar(100) NOT NULL);
--
-- Alter unique_together for contenttype (1 constraint(s))
--
ALTER TABLE `django_content_type` ADD CONSTRAINT `django_content_type_app_label_model_76bd3d3b_uniq` UNIQUE (`app_label`, `model`);
--
-- Change Meta options on contenttype
--
-- (no-op)
--
-- Alter field name on contenttype
--
ALTER TABLE `django_content_type` MODIFY `name` varchar(100) NULL;
--
-- Raw Python operation
--
-- THIS OPERATION CANNOT BE WRITTEN AS SQL
--
-- Remove field name from contenttype
--
ALTER TABLE `django_content_type` DROP COLUMN `name`;
--
-- Create model Permission
--
CREATE TABLE `auth_permission` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(50) NOT NULL, `content_type_id` integer NOT NULL, `codename` varchar(100) NOT NULL);
--
-- Create model Group
--
CREATE TABLE `auth_group` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(80) NOT NULL UNIQUE);
CREATE TABLE `auth_group_permissions` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `group_id` integer NOT NULL, `permission_id` integer NOT NULL);
--
-- Create model User
--
-- (no-op)
ALTER TABLE `auth_permission` ADD CONSTRAINT `auth_permission_content_type_id_codename_01ab375a_uniq` UNIQUE (`content_type_id`, `codename`);
ALTER TABLE `auth_permission` ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` UNIQUE (`group_id`, `permission_id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);
--
-- Alter field name on permission
--
ALTER TABLE `auth_permission` MODIFY `name` varchar(255) NOT NULL;
--
-- Alter field email on user
--
-- (no-op)
--
-- Alter field username on user
--
-- (no-op)
--
-- Alter field last_login on user
--
-- (no-op)
--
-- Alter field username on user
--
-- (no-op)
--
-- Alter field username on user
--
-- (no-op)
--
-- Alter field last_name on user
--
-- (no-op)
--
-- Alter field name on group
--
ALTER TABLE `auth_group` MODIFY `name` varchar(150) NOT NULL;
--
-- Raw Python operation
--
-- THIS OPERATION CANNOT BE WRITTEN AS SQL
--
-- Alter field first_name on user
--
-- (no-op)
--
-- Create model OtpChallenge
--
CREATE TABLE `users_otpchallenge` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `email` varchar(254) NOT NULL, `purpose` varchar(24) NOT NULL, `display_name` varchar(120) NOT NULL, `password_hash` varchar(256) NOT NULL, `code_hash` varchar(256) NOT NULL, `expires_at` datetime(6) NOT NULL, `sent_at` datetime(6) NOT NULL, `attempts` smallint UNSIGNED NOT NULL CHECK (`attempts` >= 0), `verified_at` datetime(6) NULL);
--
-- Create model User
--
CREATE TABLE `users_user` (`password` varchar(128) NOT NULL, `last_login` datetime(6) NULL, `is_superuser` bool NOT NULL, `first_name` varchar(150) NOT NULL, `last_name` varchar(150) NOT NULL, `is_staff` bool NOT NULL, `is_active` bool NOT NULL, `date_joined` datetime(6) NOT NULL, `id` char(32) NOT NULL PRIMARY KEY, `email` varchar(254) NOT NULL UNIQUE, `display_name` varchar(120) NOT NULL, `email_verified` bool NOT NULL);
CREATE TABLE `users_user_groups` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `user_id` char(32) NOT NULL, `group_id` integer NOT NULL);
CREATE TABLE `users_user_user_permissions` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `user_id` char(32) NOT NULL, `permission_id` integer NOT NULL);
--
-- Create model AuthIdentity
--
CREATE TABLE `users_authidentity` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `provider` varchar(24) NOT NULL, `provider_subject` varchar(255) NOT NULL, `email_at_provider` varchar(254) NOT NULL, `created_at` datetime(6) NOT NULL, `user_id` char(32) NOT NULL, CONSTRAINT `unique_auth_identity` UNIQUE (`provider`, `provider_subject`));
CREATE INDEX `users_otpchallenge_email_a347c98e` ON `users_otpchallenge` (`email`);
ALTER TABLE `users_user_groups` ADD CONSTRAINT `users_user_groups_user_id_group_id_b88eab82_uniq` UNIQUE (`user_id`, `group_id`);
ALTER TABLE `users_user_groups` ADD CONSTRAINT `users_user_groups_user_id_5f6f5a90_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`);
ALTER TABLE `users_user_groups` ADD CONSTRAINT `users_user_groups_group_id_9afc8d0e_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);
ALTER TABLE `users_user_user_permissions` ADD CONSTRAINT `users_user_user_permissions_user_id_permission_id_43338c45_uniq` UNIQUE (`user_id`, `permission_id`);
ALTER TABLE `users_user_user_permissions` ADD CONSTRAINT `users_user_user_permissions_user_id_20aca447_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`);
ALTER TABLE `users_user_user_permissions` ADD CONSTRAINT `users_user_user_perm_permission_id_0b93982e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);
ALTER TABLE `users_authidentity` ADD CONSTRAINT `users_authidentity_user_id_76679b8f_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`);
--
-- Create model LogEntry
--
CREATE TABLE `django_admin_log` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `action_time` datetime(6) NOT NULL, `object_id` longtext NULL, `object_repr` varchar(200) NOT NULL, `action_flag` smallint UNSIGNED NOT NULL CHECK (`action_flag` >= 0), `change_message` longtext NOT NULL, `content_type_id` integer NULL, `user_id` char(32) NOT NULL);
ALTER TABLE `django_admin_log` ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);
ALTER TABLE `django_admin_log` ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`);
--
-- Alter field action_time on logentry
--
-- (no-op)
--
-- Alter field action_flag on logentry
--
-- (no-op)
--
-- Create model Session
--
CREATE TABLE `django_session` (`session_key` varchar(40) NOT NULL PRIMARY KEY, `session_data` longtext NOT NULL, `expire_date` datetime(6) NOT NULL);
CREATE INDEX `django_session_expire_date_a5c62663` ON `django_session` (`expire_date`);
--
-- Create model ContentAsset
--
CREATE TABLE `content_contentasset` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `asset_type` varchar(20) NOT NULL, `storage_path` varchar(600) NOT NULL, `source_url` varchar(1000) NOT NULL, `mime_type` varchar(100) NOT NULL, `duration_seconds` double precision NULL, `metadata` json NOT NULL);
--
-- Create model Exam
--
CREATE TABLE `content_exam` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `external_id` varchar(80) NOT NULL UNIQUE, `title` varchar(255) NOT NULL, `provider` varchar(40) NOT NULL, `source_url` varchar(200) NOT NULL, `year` smallint UNSIGNED NULL, `slug` varchar(180) NOT NULL UNIQUE, `time_limit_seconds` integer UNSIGNED NOT NULL CHECK (`time_limit_seconds` >= 0), `question_count` integer UNSIGNED NOT NULL CHECK (`question_count` >= 0), `answer_count` integer UNSIGNED NOT NULL CHECK (`answer_count` >= 0), `status` varchar(20) NOT NULL, `source_payload` json NOT NULL, `created_at` datetime(6) NOT NULL);
CREATE INDEX `content_exam_year_idx` ON `content_exam` (`year`);
--
-- Create model ExamPart
--
CREATE TABLE `content_exampart` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `part_number` smallint UNSIGNED NOT NULL CHECK (`part_number` >= 0), `title` varchar(120) NOT NULL, `question_count` integer UNSIGNED NOT NULL CHECK (`question_count` >= 0), `exam_id` bigint NOT NULL);
--
-- Create model Passage
--
CREATE TABLE `content_passage` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `source_key` varchar(180) NOT NULL, `content_html` longtext NOT NULL, `transcript` longtext NOT NULL, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `assets` json NOT NULL, `exam_part_id` bigint NOT NULL);
--
-- Create model Question
--
CREATE TABLE `content_question` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `external_question_id` varchar(80) NOT NULL, `number` smallint UNSIGNED NOT NULL CHECK (`number` >= 0), `title` varchar(100) NOT NULL, `prompt` longtext NOT NULL, `prompt_html` longtext NOT NULL, `correct_option` varchar(1) NULL, `explanation_reason` longtext NOT NULL, `explanation_tip` longtext NOT NULL, `transcript` longtext NOT NULL, `transcript_source` varchar(100) NOT NULL, `media` json NOT NULL, `source_payload` json NOT NULL, `exam_part_id` bigint NOT NULL, `passage_id` bigint NULL);
--
-- Create model QuestionOption
--
CREATE TABLE `content_questionoption` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `option_key` varchar(1) NOT NULL, `answer_text` longtext NOT NULL, `question_id` bigint NOT NULL);
--
-- Create constraint unique_exam_part on model exampart
--
ALTER TABLE `content_exampart` ADD CONSTRAINT `unique_exam_part` UNIQUE (`exam_id`, `part_number`);
--
-- Create constraint unique_passage_key on model passage
--
ALTER TABLE `content_passage` ADD CONSTRAINT `unique_passage_key` UNIQUE (`exam_part_id`, `source_key`);
--
-- Create constraint unique_part_question on model question
--
ALTER TABLE `content_question` ADD CONSTRAINT `unique_part_question` UNIQUE (`exam_part_id`, `number`);
--
-- Create constraint unique_question_option on model questionoption
--
ALTER TABLE `content_questionoption` ADD CONSTRAINT `unique_question_option` UNIQUE (`question_id`, `option_key`);
ALTER TABLE `content_exampart` ADD CONSTRAINT `content_exampart_exam_id_d7b3e51f_fk_content_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `content_exam` (`id`);
ALTER TABLE `content_passage` ADD CONSTRAINT `content_passage_exam_part_id_400bece6_fk_content_exampart_id` FOREIGN KEY (`exam_part_id`) REFERENCES `content_exampart` (`id`);
ALTER TABLE `content_question` ADD CONSTRAINT `content_question_exam_part_id_10aa33b0_fk_content_exampart_id` FOREIGN KEY (`exam_part_id`) REFERENCES `content_exampart` (`id`);
ALTER TABLE `content_question` ADD CONSTRAINT `content_question_passage_id_23800936_fk_content_passage_id` FOREIGN KEY (`passage_id`) REFERENCES `content_passage` (`id`);
ALTER TABLE `content_questionoption` ADD CONSTRAINT `content_questionopti_question_id_2269676f_fk_content_q` FOREIGN KEY (`question_id`) REFERENCES `content_question` (`id`);
--
-- Create model PassageAsset
--
CREATE TABLE `content_passageasset` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `role` varchar(32) NOT NULL);
--
-- Create model QuestionAsset
--
CREATE TABLE `content_questionasset` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `role` varchar(32) NOT NULL);
--
-- Create constraint unique_content_asset_path on model contentasset
--
ALTER TABLE `content_contentasset` ADD CONSTRAINT `unique_content_asset_path` UNIQUE (`asset_type`, `storage_path`);
--
-- Add field asset to passageasset
--
ALTER TABLE `content_passageasset` ADD COLUMN `asset_id` bigint NOT NULL , ADD CONSTRAINT `content_passageasset_asset_id_dd4a2851_fk_content_c` FOREIGN KEY (`asset_id`) REFERENCES `content_contentasset`(`id`);
--
-- Add field passage to passageasset
--
ALTER TABLE `content_passageasset` ADD COLUMN `passage_id` bigint NOT NULL , ADD CONSTRAINT `content_passageasset_passage_id_035b490c_fk_content_passage_id` FOREIGN KEY (`passage_id`) REFERENCES `content_passage`(`id`);
--
-- Add field asset to questionasset
--
ALTER TABLE `content_questionasset` ADD COLUMN `asset_id` bigint NOT NULL , ADD CONSTRAINT `content_questionasse_asset_id_3ec0a55e_fk_content_c` FOREIGN KEY (`asset_id`) REFERENCES `content_contentasset`(`id`);
--
-- Add field question to questionasset
--
ALTER TABLE `content_questionasset` ADD COLUMN `question_id` bigint NOT NULL , ADD CONSTRAINT `content_questionasse_question_id_8a77c280_fk_content_q` FOREIGN KEY (`question_id`) REFERENCES `content_question`(`id`);
--
-- Create constraint unique_passage_asset_role on model passageasset
--
ALTER TABLE `content_passageasset` ADD CONSTRAINT `unique_passage_asset_role` UNIQUE (`passage_id`, `asset_id`, `role`);
--
-- Create constraint unique_question_asset_role on model questionasset
--
ALTER TABLE `content_questionasset` ADD CONSTRAINT `unique_question_asset_role` UNIQUE (`question_id`, `asset_id`, `role`);
--
-- Alter field title on question
--
ALTER TABLE `content_question` MODIFY `title` varchar(255) NOT NULL;
--
-- Create model VocabularyTerm
--
CREATE TABLE `vocabulary_vocabularyterm` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `word` varchar(180) NOT NULL, `level` varchar(12) NOT NULL, `part_of_speech` varchar(40) NOT NULL, `pronunciation` varchar(180) NOT NULL, `meaning_vi` longtext NOT NULL, `example_en` longtext NOT NULL, `is_active` bool NOT NULL);
--
-- Create model VocabularyTopic
--
CREATE TABLE `vocabulary_vocabularytopic` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `slug` varchar(50) NOT NULL UNIQUE, `name` varchar(160) NOT NULL, `description` longtext NOT NULL, `source_url` varchar(200) NOT NULL, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `is_published` bool NOT NULL);
--
-- Create model TermAsset
--
CREATE TABLE `vocabulary_termasset` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `asset_role` varchar(24) NOT NULL, `storage_path` varchar(600) NOT NULL, `source_url` varchar(1000) NOT NULL, `term_id` bigint NOT NULL, CONSTRAINT `unique_term_asset_role` UNIQUE (`term_id`, `asset_role`));
--
-- Create model TopicTerm
--
CREATE TABLE `vocabulary_topicterm` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `term_id` bigint NOT NULL, `topic_id` bigint NOT NULL, CONSTRAINT `unique_topic_term` UNIQUE (`topic_id`, `term_id`), CONSTRAINT `unique_topic_term_order` UNIQUE (`topic_id`, `sort_order`));
CREATE INDEX `vocabulary_vocabularyterm_word_cbbd230c` ON `vocabulary_vocabularyterm` (`word`);
ALTER TABLE `vocabulary_termasset` ADD CONSTRAINT `vocabulary_termasset_term_id_ed3a5f26_fk_vocabular` FOREIGN KEY (`term_id`) REFERENCES `vocabulary_vocabularyterm` (`id`);
ALTER TABLE `vocabulary_topicterm` ADD CONSTRAINT `vocabulary_topicterm_term_id_ac6e98dd_fk_vocabular` FOREIGN KEY (`term_id`) REFERENCES `vocabulary_vocabularyterm` (`id`);
ALTER TABLE `vocabulary_topicterm` ADD CONSTRAINT `vocabulary_topicterm_topic_id_f9674fdf_fk_vocabular` FOREIGN KEY (`topic_id`) REFERENCES `vocabulary_vocabularytopic` (`id`);
--
-- Create model VocabularyQuizAnswer
--
CREATE TABLE `learning_vocabularyquizanswer` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `prompt_type` varchar(16) NOT NULL, `options_json` json NOT NULL, `correct_value` longtext NOT NULL, `selected_value` longtext NOT NULL, `is_correct` bool NULL, `answered_at` datetime(6) NULL, `position` smallint UNSIGNED NOT NULL CHECK (`position` >= 0));
--
-- Create model VocabularyQuizAttempt
--
CREATE TABLE `learning_vocabularyquizattempt` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `scope` varchar(16) NOT NULL, `question_type` varchar(16) NOT NULL, `question_count` smallint UNSIGNED NOT NULL CHECK (`question_count` >= 0), `correct_count` smallint UNSIGNED NOT NULL CHECK (`correct_count` >= 0), `status` varchar(16) NOT NULL, `started_at` datetime(6) NOT NULL, `submitted_at` datetime(6) NULL);
--
-- Create model VocabularyProgress
--
CREATE TABLE `learning_vocabularyprogress` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `status` varchar(16) NOT NULL, `seen_count` integer UNSIGNED NOT NULL CHECK (`seen_count` >= 0), `correct_count` integer UNSIGNED NOT NULL CHECK (`correct_count` >= 0), `wrong_count` integer UNSIGNED NOT NULL CHECK (`wrong_count` >= 0), `last_seen_at` datetime(6) NULL, `learned_at` datetime(6) NULL, `next_review_at` datetime(6) NULL, `term_id` bigint NOT NULL);
ALTER TABLE `learning_vocabularyprogress` ADD CONSTRAINT `learning_vocabularyp_term_id_92ffa803_fk_vocabular` FOREIGN KEY (`term_id`) REFERENCES `vocabulary_vocabularyterm` (`id`);
--
-- Add field user to vocabularyprogress
--
ALTER TABLE `learning_vocabularyprogress` ADD COLUMN `user_id` char(32) NOT NULL , ADD CONSTRAINT `learning_vocabularyprogress_user_id_8e13d1f6_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user`(`id`);
--
-- Add field term to vocabularyquizanswer
--
ALTER TABLE `learning_vocabularyquizanswer` ADD COLUMN `term_id` bigint NOT NULL , ADD CONSTRAINT `learning_vocabularyq_term_id_71d0d933_fk_vocabular` FOREIGN KEY (`term_id`) REFERENCES `vocabulary_vocabularyterm`(`id`);
--
-- Add field topic to vocabularyquizattempt
--
ALTER TABLE `learning_vocabularyquizattempt` ADD COLUMN `topic_id` bigint NULL , ADD CONSTRAINT `learning_vocabularyq_topic_id_934a75ad_fk_vocabular` FOREIGN KEY (`topic_id`) REFERENCES `vocabulary_vocabularytopic`(`id`);
--
-- Add field user to vocabularyquizattempt
--
ALTER TABLE `learning_vocabularyquizattempt` ADD COLUMN `user_id` char(32) NOT NULL , ADD CONSTRAINT `learning_vocabularyquizattempt_user_id_b915ed2b_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user`(`id`);
--
-- Add field attempt to vocabularyquizanswer
--
ALTER TABLE `learning_vocabularyquizanswer` ADD COLUMN `attempt_id` bigint NOT NULL , ADD CONSTRAINT `learning_vocabularyq_attempt_id_5a99ec8e_fk_learning_` FOREIGN KEY (`attempt_id`) REFERENCES `learning_vocabularyquizattempt`(`id`);
--
-- Create constraint unique_user_term_progress on model vocabularyprogress
--
ALTER TABLE `learning_vocabularyprogress` ADD CONSTRAINT `unique_user_term_progress` UNIQUE (`user_id`, `term_id`);
--
-- Create constraint unique_quiz_position on model vocabularyquizanswer
--
ALTER TABLE `learning_vocabularyquizanswer` ADD CONSTRAINT `unique_quiz_position` UNIQUE (`attempt_id`, `position`);
--
-- Create model AttemptPart
--
CREATE TABLE `assessments_attemptpart` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `position` smallint UNSIGNED NOT NULL CHECK (`position` >= 0), `exam_part_id` bigint NOT NULL);
--
-- Create model PartScore
--
CREATE TABLE `assessments_partscore` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `answered_count` integer UNSIGNED NOT NULL CHECK (`answered_count` >= 0), `scored_count` integer UNSIGNED NOT NULL CHECK (`scored_count` >= 0), `correct_count` integer UNSIGNED NOT NULL CHECK (`correct_count` >= 0), `score_percent` double precision NOT NULL, `exam_part_id` bigint NOT NULL);
--
-- Create model TestAnswer
--
CREATE TABLE `assessments_testanswer` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `selected_option` varchar(1) NOT NULL, `is_correct` bool NULL, `answered_at` datetime(6) NULL, `question_id` bigint NOT NULL);
--
-- Create model TestAttempt
--
CREATE TABLE `assessments_testattempt` (`id` char(32) NOT NULL PRIMARY KEY, `mode` varchar(12) NOT NULL, `status` varchar(16) NOT NULL, `time_limit_seconds` integer UNSIGNED NULL CHECK (`time_limit_seconds` >= 0), `started_at` datetime(6) NOT NULL, `submitted_at` datetime(6) NULL, `last_activity_at` datetime(6) NOT NULL, `exam_id` bigint NOT NULL, `scoring_version` varchar(32) NOT NULL DEFAULT 'TOEIC_ESTIMATE_V1');
ALTER TABLE `assessments_attemptpart` ADD CONSTRAINT `assessments_attemptp_exam_part_id_87b2d743_fk_content_e` FOREIGN KEY (`exam_part_id`) REFERENCES `content_exampart` (`id`);
ALTER TABLE `assessments_partscore` ADD CONSTRAINT `assessments_partscor_exam_part_id_9df6e132_fk_content_e` FOREIGN KEY (`exam_part_id`) REFERENCES `content_exampart` (`id`);
ALTER TABLE `assessments_testanswer` ADD CONSTRAINT `assessments_testansw_question_id_d31e3a79_fk_content_q` FOREIGN KEY (`question_id`) REFERENCES `content_question` (`id`);
ALTER TABLE `assessments_testattempt` ADD CONSTRAINT `assessments_testattempt_exam_id_46955424_fk_content_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `content_exam` (`id`);
--
-- Add field user to testattempt
--
ALTER TABLE `assessments_testattempt` ADD COLUMN `user_id` char(32) NULL , ADD CONSTRAINT `assessments_testattempt_user_id_26fdee5b_fk_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_user`(`id`);
--
-- Add field attempt to testanswer
--
ALTER TABLE `assessments_testanswer` ADD COLUMN `attempt_id` char(32) NOT NULL , ADD CONSTRAINT `assessments_testansw_attempt_id_e59b0092_fk_assessmen` FOREIGN KEY (`attempt_id`) REFERENCES `assessments_testattempt`(`id`);
--
-- Add field attempt to partscore
--
ALTER TABLE `assessments_partscore` ADD COLUMN `attempt_id` char(32) NOT NULL , ADD CONSTRAINT `assessments_partscor_attempt_id_cdfe651e_fk_assessmen` FOREIGN KEY (`attempt_id`) REFERENCES `assessments_testattempt`(`id`);
--
-- Add field attempt to attemptpart
--
ALTER TABLE `assessments_attemptpart` ADD COLUMN `attempt_id` char(32) NOT NULL , ADD CONSTRAINT `assessments_attemptp_attempt_id_9e62b8ea_fk_assessmen` FOREIGN KEY (`attempt_id`) REFERENCES `assessments_testattempt`(`id`);
--
-- Create constraint unique_attempt_question on model testanswer
--
ALTER TABLE `assessments_testanswer` ADD CONSTRAINT `unique_attempt_question` UNIQUE (`attempt_id`, `question_id`);
--
-- Create constraint unique_attempt_part_score on model partscore
--
ALTER TABLE `assessments_partscore` ADD CONSTRAINT `unique_attempt_part_score` UNIQUE (`attempt_id`, `exam_part_id`);
--
-- Create constraint unique_attempt_part on model attemptpart
--
ALTER TABLE `assessments_attemptpart` ADD CONSTRAINT `unique_attempt_part` UNIQUE (`attempt_id`, `exam_part_id`);
--
-- Create model GrammarNote
--
CREATE TABLE `knowledge_grammarnote` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `title` varchar(240) NOT NULL, `body` longtext NOT NULL, `quick_rule` longtext NOT NULL, `example` longtext NOT NULL, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `is_published` bool NOT NULL);
--
-- Create model KnowledgeArticle
--
CREATE TABLE `knowledge_knowledgearticle` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `title` varchar(240) NOT NULL, `url` varchar(200) NOT NULL, `source_name` varchar(140) NOT NULL, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `is_published` bool NOT NULL);
--
-- Create model PartTip
--
CREATE TABLE `knowledge_parttip` (`id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY, `part_number` smallint UNSIGNED NOT NULL CHECK (`part_number` >= 0), `title` varchar(240) NOT NULL, `body` longtext NOT NULL, `sort_order` integer UNSIGNED NOT NULL CHECK (`sort_order` >= 0), `is_published` bool NOT NULL);
-- Mark only Django built-in migrations as already applied.
INSERT INTO django_migrations (app, name, applied) VALUES
('contenttypes','0001_initial','2026-01-01 00:00:00.000000'),
('contenttypes','0002_remove_content_type_name','2026-01-01 00:00:00.000000'),
('auth','0001_initial','2026-01-01 00:00:00.000000'),
('auth','0002_alter_permission_name_max_length','2026-01-01 00:00:00.000000'),
('auth','0003_alter_user_email_max_length','2026-01-01 00:00:00.000000'),
('auth','0004_alter_user_username_opts','2026-01-01 00:00:00.000000'),
('auth','0005_alter_user_last_login_null','2026-01-01 00:00:00.000000'),
('auth','0006_require_contenttypes_0002','2026-01-01 00:00:00.000000'),
('auth','0007_alter_validators_add_error_messages','2026-01-01 00:00:00.000000'),
('auth','0008_alter_user_username_max_length','2026-01-01 00:00:00.000000'),
('auth','0009_alter_user_last_name_max_length','2026-01-01 00:00:00.000000'),
('auth','0010_alter_group_name_max_length','2026-01-01 00:00:00.000000'),
('auth','0011_update_proxy_permissions','2026-01-01 00:00:00.000000'),
('auth','0012_alter_user_first_name_max_length','2026-01-01 00:00:00.000000'),
('admin','0001_initial','2026-01-01 00:00:00.000000'),
('admin','0002_logentry_remove_auto_add','2026-01-01 00:00:00.000000'),
('admin','0003_logentry_add_action_flag_choices','2026-01-01 00:00:00.000000'),
('sessions','0001_initial','2026-01-01 00:00:00.000000');
SET FOREIGN_KEY_CHECKS=1;
