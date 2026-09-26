-- Persist the current question so an interrupted full test can resume on any device.
ALTER TABLE `assessments_testattempt`
    ADD COLUMN `current_question_index` integer unsigned NOT NULL DEFAULT 0;
