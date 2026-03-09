-- 修复数据库编码问题
-- 使用此脚本前先备份数据

USE scheduling_db;

-- 1. 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 转换所有表为 utf8mb4_unicode_ci
ALTER TABLE schedules CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE preferences CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE shifts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE members CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 设置数据库默认编码
ALTER DATABASE scheduling_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 5. 验证结果
SHOW TABLE STATUS WHERE Database = 'scheduling_db';
