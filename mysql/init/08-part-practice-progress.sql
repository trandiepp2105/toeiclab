CREATE TABLE IF NOT EXISTS `learning_partpracticeprogress` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `part_number` smallint unsigned NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_question_id` bigint NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_part_practice_progress` (`user_id`, `part_number`),
  KEY `learning_partpracticeprogress_last_question_idx` (`last_question_id`),
  CONSTRAINT `learning_partpracticeprogress_question_fk`
    FOREIGN KEY (`last_question_id`) REFERENCES `content_question` (`id`) ON DELETE SET NULL,
  CONSTRAINT `learning_partpracticeprogress_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`) ON DELETE CASCADE
);
