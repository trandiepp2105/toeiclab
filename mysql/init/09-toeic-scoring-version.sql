-- Existing full-test attempts keep their previous scoring behavior. New attempts
-- use the default TOEIC_ESTIMATE_V1 declared on assessments_testattempt.
SET @scoring_version_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'assessments_testattempt'
    AND column_name = 'scoring_version'
);
SET @scoring_version_ddl = IF(
  @scoring_version_column_exists = 0,
  "ALTER TABLE `assessments_testattempt` ADD COLUMN `scoring_version` varchar(32) NOT NULL DEFAULT 'TOEIC_ESTIMATE_V1'",
  'SELECT 1'
);
PREPARE scoring_version_statement FROM @scoring_version_ddl;
EXECUTE scoring_version_statement;
DEALLOCATE PREPARE scoring_version_statement;

UPDATE `assessments_testattempt`
SET `scoring_version` = 'TOEIC_ESTIMATE_LEGACY'
WHERE @scoring_version_column_exists = 0 AND `mode` = 'full';
