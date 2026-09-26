-- Store TOEIC reading directions and defer full-test timing until Start is pressed.
SET NAMES utf8mb4;

ALTER TABLE `assessments_testattempt`
    ADD COLUMN `exam_started_at` datetime(6) NULL;

-- Preserve the clock semantics for attempts created by versions before this change.
UPDATE `assessments_testattempt`
SET `exam_started_at` = `started_at`
WHERE `mode` = 'full';

CREATE TABLE `directions` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `part_number` smallint unsigned NOT NULL,
    `title` varchar(120) NOT NULL,
    `direction_html` longtext NOT NULL,
    `image_path` varchar(600) NOT NULL,
    `example_html` longtext NOT NULL,
    `sort_order` smallint unsigned NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `directions_part_number_unique` (`part_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        1,
        'Part 1 - Photographs',
        '<p>For each question in this part, you will hear four statements about a picture in your test book. When you hear the statements, you must select the one statement that best describes what you see in the picture. Then find the number of the question on your answer sheet and mark your answer. The statements will not be printed in your test book and will be spoken only one time.</p>',
        'directions/image-direction-part-1.jpg',
        '<p>Statement (C), "They''re sitting at a table," is the best description of the picture, so you should select answer (C) and mark it on your answer sheet.</p>',
        1
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        2,
        'Part 2 - Question-Response',
        '<p>You will hear a question or statement and three responses spoken in English. They will not be printed in your test book and will be spoken only one time. Select the best response to the question or statement and mark the letter (A), (B), or (C) on your answer sheet.</p>',
        '',
        '',
        2
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        3,
        'Part 3 - Conversations',
        '<p>You will hear some conversations between two or more people. You will be asked to answer three questions about what the speakers say in each conversation. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The conversations will not be printed in your test book and will be spoken only one time.</p>',
        '',
        '',
        3
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        4,
        'Part 4 - Talks',
        '<p>You will hear some talks given by a single speaker. You will be asked to answer three questions about what the speaker says in each talk. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The talks will not be printed in your test book and will be spoken only one time.</p>',
        '',
        '',
        4
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        5,
        'Part 5 - Incomplete Sentences',
        '<p>A word or phrase is missing in each of the following sentences. Four answer choices are given below each sentence. Select the best answer to complete the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.</p>',
        '',
        '',
        5
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        6,
        'Part 6 - Text Completion',
        '<p>Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices for each empty space are given below the text. Select the best answer to complete the text. Then mark the letter (A), (B), (C), or (D) on your answer sheet.</p>',
        '',
        '',
        6
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);

INSERT INTO `directions`
    (`part_number`, `title`, `direction_html`, `image_path`, `example_html`, `sort_order`)
VALUES
    (
        7,
        'Part 7 - Reading Comprehension',
        '<p>In this part you will read a selection of texts, such as magazine and newspaper articles, e-mails, and instant messages. Each text or set of texts is followed by several questions. Select the best answer for each question and mark the letter (A), (B), (C), or (D) on your answer sheet.</p>',
        '',
        '',
        7
    )
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`), `direction_html` = VALUES(`direction_html`),
    `image_path` = VALUES(`image_path`), `example_html` = VALUES(`example_html`),
    `sort_order` = VALUES(`sort_order`);
