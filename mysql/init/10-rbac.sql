-- TOEIC Lab application RBAC. Safe to run on both the historical schema
-- (which has users_user.is_staff) and a fresh schema after bootstrap.
CREATE TABLE IF NOT EXISTS `users_role` (
    `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` varchar(64) NOT NULL UNIQUE,
    `name` varchar(120) NOT NULL,
    `description` longtext NOT NULL,
    `is_system` bool NOT NULL DEFAULT FALSE,
    `created_at` datetime(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS `users_adminpermission` (
    `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` varchar(80) NOT NULL UNIQUE,
    `name` varchar(120) NOT NULL,
    `module` varchar(40) NOT NULL,
    `description` longtext NOT NULL
);

CREATE TABLE IF NOT EXISTS `users_rolepermission` (
    `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `role_id` bigint NOT NULL,
    `permission_id` bigint NOT NULL,
    CONSTRAINT `unique_role_permission` UNIQUE (`role_id`, `permission_id`),
    CONSTRAINT `users_rolepermission_role_fk` FOREIGN KEY (`role_id`) REFERENCES `users_role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `users_rolepermission_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `users_adminpermission` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `users_userrole` (
    `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` char(32) NOT NULL,
    `role_id` bigint NOT NULL,
    `assigned_by_id` char(32) NULL,
    `assigned_at` datetime(6) NOT NULL,
    CONSTRAINT `unique_user_role` UNIQUE (`user_id`, `role_id`),
    KEY `users_role_user_idx` (`role_id`, `user_id`),
    CONSTRAINT `users_userrole_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users_user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `users_userrole_role_fk` FOREIGN KEY (`role_id`) REFERENCES `users_role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `users_userrole_assigned_by_fk` FOREIGN KEY (`assigned_by_id`) REFERENCES `users_user` (`id`) ON DELETE SET NULL
);

INSERT INTO `users_adminpermission` (`code`, `name`, `module`, `description`) VALUES
    ('admin.access', 'Truy cập trang quản trị', 'dashboard', 'Được phép đăng nhập ứng dụng quản trị.'),
    ('dashboard.view', 'Xem tổng quan', 'dashboard', 'Xem số liệu tổng quan ứng dụng.'),
    ('users.view', 'Xem người dùng', 'users', 'Xem danh sách và hồ sơ người dùng.'),
    ('users.manage', 'Quản lý người dùng', 'users', 'Khóa, mở khóa và cập nhật người dùng.'),
    ('roles.view', 'Xem vai trò', 'roles', 'Xem vai trò và quyền được cấp.'),
    ('roles.manage', 'Quản lý vai trò', 'roles', 'Tạo vai trò và gán vai trò cho người dùng.'),
    ('vocabulary.view', 'Xem từ vựng', 'vocabulary', 'Xem kho từ vựng và chủ đề.'),
    ('vocabulary.manage', 'Quản lý từ vựng', 'vocabulary', 'Tạo và cập nhật kho từ vựng.'),
    ('knowledge.view', 'Xem bài học', 'knowledge', 'Xem nội dung ngữ pháp và mẹo TOEIC.'),
    ('knowledge.manage', 'Quản lý bài học', 'knowledge', 'Tạo và cập nhật nội dung bài học.'),
    ('exams.view', 'Xem ngân hàng đề', 'exams', 'Xem đề thi và câu hỏi.'),
    ('exams.manage', 'Quản lý ngân hàng đề', 'exams', 'Cập nhật đề thi và đáp án.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `module` = VALUES(`module`), `description` = VALUES(`description`);

INSERT INTO `users_role` (`code`, `name`, `description`, `is_system`, `created_at`) VALUES
    ('learner', 'Học viên', 'Vai trò mặc định cho tài khoản học tập.', TRUE, NOW(6)),
    ('super_admin', 'Quản trị viên toàn quyền', 'Toàn quyền quản trị TOEIC Lab.', TRUE, NOW(6)),
    ('user_manager', 'Quản lý người dùng', 'Quản lý tài khoản người dùng.', TRUE, NOW(6)),
    ('content_manager', 'Quản lý nội dung', 'Quản lý từ vựng, ngữ pháp và mẹo TOEIC.', TRUE, NOW(6)),
    ('exam_manager', 'Quản lý ngân hàng đề', 'Quản lý đề thi và câu hỏi.', TRUE, NOW(6)),
    ('read_only_admin', 'Quản trị chỉ xem', 'Xem dữ liệu quản trị mà không chỉnh sửa.', TRUE, NOW(6))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`), `is_system` = TRUE;

INSERT IGNORE INTO `users_rolepermission` (`role_id`, `permission_id`)
SELECT role_row.`id`, permission_row.`id`
FROM `users_role` AS role_row
CROSS JOIN `users_adminpermission` AS permission_row
WHERE role_row.`code` = 'super_admin';

INSERT IGNORE INTO `users_rolepermission` (`role_id`, `permission_id`)
SELECT role_row.`id`, permission_row.`id`
FROM `users_role` AS role_row
JOIN `users_adminpermission` AS permission_row
  ON permission_row.`code` IN ('admin.access', 'dashboard.view', 'users.view', 'users.manage')
WHERE role_row.`code` = 'user_manager';

INSERT IGNORE INTO `users_rolepermission` (`role_id`, `permission_id`)
SELECT role_row.`id`, permission_row.`id`
FROM `users_role` AS role_row
JOIN `users_adminpermission` AS permission_row
  ON permission_row.`code` IN ('admin.access', 'dashboard.view', 'vocabulary.view', 'vocabulary.manage', 'knowledge.view', 'knowledge.manage')
WHERE role_row.`code` = 'content_manager';

INSERT IGNORE INTO `users_rolepermission` (`role_id`, `permission_id`)
SELECT role_row.`id`, permission_row.`id`
FROM `users_role` AS role_row
JOIN `users_adminpermission` AS permission_row
  ON permission_row.`code` IN ('admin.access', 'dashboard.view', 'exams.view', 'exams.manage')
WHERE role_row.`code` = 'exam_manager';

INSERT IGNORE INTO `users_rolepermission` (`role_id`, `permission_id`)
SELECT role_row.`id`, permission_row.`id`
FROM `users_role` AS role_row
JOIN `users_adminpermission` AS permission_row
  ON permission_row.`code` IN ('admin.access', 'dashboard.view', 'users.view', 'roles.view', 'vocabulary.view', 'knowledge.view', 'exams.view')
WHERE role_row.`code` = 'read_only_admin';

INSERT IGNORE INTO `users_userrole` (`user_id`, `role_id`, `assigned_at`)
SELECT user_row.`id`, role_row.`id`, NOW(6)
FROM `users_user` AS user_row
JOIN `users_role` AS role_row ON role_row.`code` = 'learner';

-- Preserve every existing staff/superuser as an administrator before removing
-- the legacy flag. Prepared statements keep this valid on a fresh schema too.
SET @staff_column_exists = (
    SELECT COUNT(*) FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'users_user'
      AND `column_name` = 'is_staff'
);
SET @staff_migration_sql = IF(
    @staff_column_exists,
    'INSERT IGNORE INTO `users_userrole` (`user_id`, `role_id`, `assigned_at`) SELECT user_row.`id`, role_row.`id`, NOW(6) FROM `users_user` AS user_row JOIN `users_role` AS role_row ON role_row.`code` = ''super_admin'' WHERE user_row.`is_staff` = 1 OR user_row.`is_superuser` = 1',
    'INSERT IGNORE INTO `users_userrole` (`user_id`, `role_id`, `assigned_at`) SELECT user_row.`id`, role_row.`id`, NOW(6) FROM `users_user` AS user_row JOIN `users_role` AS role_row ON role_row.`code` = ''super_admin'' WHERE user_row.`is_superuser` = 1'
);
PREPARE staff_migration_statement FROM @staff_migration_sql;
EXECUTE staff_migration_statement;
DEALLOCATE PREPARE staff_migration_statement;

DELETE learner_assignment
FROM `users_userrole` AS learner_assignment
JOIN `users_role` AS learner_role ON learner_role.`id` = learner_assignment.`role_id` AND learner_role.`code` = 'learner'
JOIN `users_userrole` AS admin_assignment ON admin_assignment.`user_id` = learner_assignment.`user_id`
JOIN `users_role` AS admin_role ON admin_role.`id` = admin_assignment.`role_id` AND admin_role.`code` = 'super_admin';

SET @drop_staff_column_sql = IF(
    @staff_column_exists,
    'ALTER TABLE `users_user` DROP COLUMN `is_staff`',
    'SELECT 1'
);
PREPARE drop_staff_column_statement FROM @drop_staff_column_sql;
EXECUTE drop_staff_column_statement;
DEALLOCATE PREPARE drop_staff_column_statement;
