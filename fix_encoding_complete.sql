-- 修复数据库编码问题 - 完整版
-- 步骤：删除外键 → 转换编码 → 重新添加外键

USE scheduling_db;

-- ========== 第一步：删除外键约束 ==========
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE preferences DROP FOREIGN KEY fk_preferences_member;
ALTER TABLE preferences DROP FOREIGN KEY fk_preferences_shift;
ALTER TABLE schedules DROP FOREIGN KEY fk_schedules_member;
ALTER TABLE schedules DROP FOREIGN KEY fk_schedules_shift;

-- ========== 第二步：转换所有表为 utf8mb4_unicode_ci ==========
ALTER TABLE schedules CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE preferences CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE shifts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE members CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========== 第三步：设置数据库默认编码 ==========
ALTER DATABASE scheduling_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========== 第四步：重新添加外键约束 ==========
ALTER TABLE preferences 
    ADD CONSTRAINT fk_preferences_member 
    FOREIGN KEY (student_id) 
    REFERENCES members(student_id) 
    ON DELETE CASCADE;

ALTER TABLE preferences 
    ADD CONSTRAINT fk_preferences_shift 
    FOREIGN KEY (shift_id) 
    REFERENCES shifts(shift_id) 
    ON DELETE CASCADE;

ALTER TABLE schedules 
    ADD CONSTRAINT fk_schedules_member 
    FOREIGN KEY (student_id) 
    REFERENCES members(student_id) 
    ON DELETE CASCADE;

ALTER TABLE schedules 
    ADD CONSTRAINT fk_schedules_shift 
    FOREIGN KEY (shift_id) 
    REFERENCES shifts(shift_id) 
    ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- ========== 第五步：验证结果 ==========
SELECT 
    TABLE_NAME,
    TABLE_COLLATION
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'scheduling_db';
