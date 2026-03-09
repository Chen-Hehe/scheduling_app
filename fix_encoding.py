# -*- coding: utf-8 -*-
"""
修复数据库编码问题
将所有表转换为 utf8mb4_unicode_ci 编码
"""
import sys
sys.path.insert(0, 'D:\\app_extension\\cursor_projects\\scheduling-app')

from app.database import engine, SessionLocal, verify_connection_encoding
from sqlalchemy import text

def fix_table_encoding(table_name: str):
    """修复单个表的编码"""
    db = SessionLocal()
    try:
        # 检查当前编码
        result = db.execute(text(f"SHOW FULL COLUMNS FROM {table_name}")).fetchall()
        print(f"\n表 {table_name} 当前编码:")
        for col in result:
            if col[1] and 'char' in col[1].lower():
                print(f"  {col[0]}: {col[1]}")
        
        # 转换为 utf8mb4
        db.execute(text(f"ALTER TABLE {table_name} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        db.commit()
        print(f"✓ 表 {table_name} 已转换为 utf8mb4_unicode_ci")
    except Exception as e:
        print(f"✗ 表 {table_name} 转换失败：{e}")
        db.rollback()
    finally:
        db.close()

def main():
    print("=" * 60)
    print("数据库编码修复工具")
    print("=" * 60)
    
    # 验证连接编码
    print("\n1. 验证连接编码...")
    verify_connection_encoding()
    
    # 修复所有表
    print("\n2. 修复表编码...")
    tables = ['members', 'shifts', 'preferences', 'schedules']
    
    # 由于外键约束，需要按顺序处理
    # 先处理没有外键的表
    fix_table_encoding('schedules')
    fix_table_encoding('preferences')
    
    # 然后处理有外键引用的表
    fix_table_encoding('shifts')
    fix_table_encoding('members')
    
    # 最后设置数据库默认编码
    print("\n3. 设置数据库默认编码...")
    db = SessionLocal()
    try:
        db.execute(text("ALTER DATABASE scheduling_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        db.commit()
        print("✓ 数据库默认编码已设置")
    except Exception as e:
        print(f"✗ 数据库编码设置失败：{e}")
        db.rollback()
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("编码修复完成！请重启后端服务以应用更改")
    print("=" * 60)

if __name__ == "__main__":
    main()
