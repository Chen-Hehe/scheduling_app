# app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# MySQL 连接配置 - 使用 utf8mb4 编码确保中文正常显示
# 参数说明：
# - charset=utf8mb4: 使用 UTF-8 完整字符集（支持 emoji）
# - collation=utf8mb4_unicode_ci: 使用 Unicode 排序规则
# - use_unicode=1: 启用 Unicode 支持
DATABASE_URL = "mysql+pymysql://root:1472580369abc@localhost:3306/scheduling_db?charset=utf8mb4&collation=utf8mb4_unicode_ci&use_unicode=1"

engine = create_engine(
    DATABASE_URL,
    echo=False,          # 调试时可以改为 True，输出 SQL
    pool_pre_ping=True,  # 避免 MySQL 长连接断开问题
    pool_recycle=3600,   # 1 小时后回收连接
)

# 验证连接编码
def verify_connection_encoding():
    """验证数据库连接编码是否正确"""
    db = SessionLocal()
    try:
        result = db.execute(text("SHOW VARIABLES LIKE 'character_set_connection'")).fetchone()
        print(f"Connection charset: {result[1]}")
        result = db.execute(text("SHOW VARIABLES LIKE 'collation_connection'")).fetchone()
        print(f"Connection collation: {result[1]}")
    finally:
        db.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
