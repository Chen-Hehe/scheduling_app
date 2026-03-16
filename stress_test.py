"""
排班算法压力测试脚本
测试不同规模数据下的排班生成性能和正确性
"""

import time
import random
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 数据库连接
DATABASE_URL = "mysql+pymysql://root:1472580369abc@localhost:3306/scheduling_db?charset=utf8mb4&collation=utf8mb4_unicode_ci&use_unicode=1"
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 导入模型
sys.path.insert(0, 'D:\\app_extension\\cursor_projects\\scheduling-app')
from app.models import Member, Shift, Preference, Schedule
from app.database import Base

# 测试配置
TEST_CASES = [
    {"name": "Small (100 members, 20 shifts)", "members": 100, "shifts": 20},
    {"name": "Medium (500 members, 50 shifts)", "members": 500, "shifts": 50},
    {"name": "Large (1000 members, 100 shifts)", "members": 1000, "shifts": 100},
    {"name": "XL (2000 members, 150 shifts)", "members": 2000, "shifts": 150},
]

POSITIONS = ["干事", "副部长", "部长"]
POSITION_WEIGHTS = [0.7, 0.2, 0.1]  # 70% 干事，20% 副部长，10% 部长

DEPARTMENTS = [
    "学生会办公室", "学习部", "文艺部", "体育部", "外联部",
    "宣传部", "组织部", "志愿者部", "权益部", "科技部"
]

DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
TIME_SLOTS = ["早班 (8:00-12:00)", "中班 (12:00-16:00)", "晚班 (16:00-20:00)"]


def clear_database():
    """清空数据库表"""
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.execute(text("TRUNCATE TABLE schedules"))
        conn.execute(text("TRUNCATE TABLE preferences"))
        conn.execute(text("TRUNCATE TABLE shifts"))
        conn.execute(text("TRUNCATE TABLE members"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        conn.commit()


def generate_test_data(num_members: int, num_shifts: int):
    """生成测试数据"""
    db = SessionLocal()
    
    try:
        # 生成成员
        print(f"  Generating {num_members} members...")
        for i in range(num_members):
            student_id = f"2024{str(i).zfill(4)}"
            position = random.choices(POSITIONS, weights=POSITION_WEIGHTS)[0]
            member = Member(
                student_id=student_id,
                name=f"TestStudent{i}",
                department=random.choice(DEPARTMENTS),
                position=position,
                has_submitted=True,
                submit_time=datetime.now()
            )
            db.add(member)
        
        db.commit()
        
        # 生成班次（确保唯一性）
        print(f"  Generating {num_shifts} shifts...")
        generated_shifts = set()
        shift_counter = 0
        
        while len(generated_shifts) < num_shifts:
            week = "Week1" if shift_counter < num_shifts // 2 else "Week2"
            day = DAYS[shift_counter % len(DAYS)]
            time_slot = TIME_SLOTS[(shift_counter // len(DAYS)) % len(TIME_SLOTS)]
            shift_id = f"{week}-{day}-Slot{shift_counter}"
            
            if shift_id not in generated_shifts:
                generated_shifts.add(shift_id)
                shift = Shift(
                    shift_id=shift_id,
                    week=week,
                    day=day,
                    time_slot=time_slot,
                    min_required=random.randint(1, 3)
                )
                db.add(shift)
            
            shift_counter += 1
        
        db.commit()
        
        # 生成志愿（每人 3-6 个志愿）
        print(f"  正在生成志愿数据...")
        all_shifts = db.query(Shift).all()
        shift_ids = [s.shift_id for s in all_shifts]
        
        for i in range(num_members):
            student_id = f"2024{str(i).zfill(4)}"
            num_prefs = random.randint(3, 6)
            selected_shifts = random.sample(shift_ids, min(num_prefs, len(shift_ids)))
            
            for rank, shift_id in enumerate(selected_shifts, 1):
                pref = Preference(
                    student_id=student_id,
                    shift_id=shift_id,
                    preference_rank=rank
                )
                db.add(pref)
        
        db.commit()
        print(f"  Data generation complete!")
        
    finally:
        db.close()


def run_scheduling_algorithm():
    """运行排班算法（直接调用 main.py 中的逻辑）"""
    from app.main import generate_schedule
    from app.database import SessionLocal as AppSessionLocal
    
    db = AppSessionLocal()
    try:
        result = generate_schedule(db=db)
        return result
    finally:
        db.close()


def verify_results(db):
    """验证排班结果"""
    # 检查每个班次是否至少有 min_required 人
    shifts = db.query(Shift).all()
    issues = []
    
    for shift in shifts:
        count = db.query(Schedule).filter(Schedule.shift_id == shift.shift_id).count()
        if count < shift.min_required:
            issues.append(f"班次 {shift.shift_id}: 需要{shift.min_required}人，实际{count}人")
    
    # 检查每人是否超过最大班次数
    members = db.query(Member).all()
    for member in members:
        max_count = 2 if member.position in ["部长", "副部长"] else 1
        count = db.query(Schedule).filter(Schedule.student_id == member.student_id).count()
        if count > max_count:
            issues.append(f"成员 {member.name}: 最多{max_count}班，实际{count}班")
    
    return issues


def run_test(test_case):
    """运行单个测试用例"""
    print(f"\n{'='*60}")
    print(f"Test: {test_case['name']}")
    print(f"{'='*60}")
    
    # 清空数据库
    print("Clearing database...")
    clear_database()
    
    # 生成数据
    generate_test_data(test_case['members'], test_case['shifts'])
    
    # 运行排班算法
    print("Running scheduling algorithm...")
    start_time = time.time()
    
    db = SessionLocal()
    try:
        result = run_scheduling_algorithm()
        elapsed = time.time() - start_time
        
        print(f"\nScheduling complete: {result.message}")
        print(f"Time elapsed: {elapsed:.2f} seconds")
        
        # 统计结果
        total_assignments = db.query(Schedule).count()
        scheduled_members = db.query(Schedule.student_id).distinct().count()
        total_members = db.query(Member).count()
        
        print(f"\nResults:")
        print(f"  - Total assignments: {total_assignments}")
        print(f"  - Scheduled members: {scheduled_members}/{total_members}")
        print(f"  - Coverage: {scheduled_members/total_members*100:.1f}%")
        
        # 验证
        print("\nVerifying results...")
        issues = verify_results(db)
        if issues:
            print(f"  [WARN] Found {len(issues)} issues:")
            for issue in issues[:5]:  # 只显示前 5 个
                print(f"    - {issue}")
        else:
            print("  [OK] All constraints satisfied!")
        
        return {
            "name": test_case['name'],
            "members": test_case['members'],
            "shifts": test_case['shifts'],
            "elapsed": elapsed,
            "total_assignments": total_assignments,
            "scheduled_members": scheduled_members,
            "coverage": scheduled_members/total_members*100,
            "issues": len(issues)
        }
        
    finally:
        db.close()


def main():
    print("="*60)
    print("Scheduling System - Stress Test")
    print("="*60)
    
    results = []
    for test_case in TEST_CASES:
        try:
            result = run_test(test_case)
            results.append(result)
        except Exception as e:
            print(f"Test FAILED: {e}")
            results.append({
                "name": test_case['name'],
                "error": str(e)
            })
    
    # 汇总报告
    print(f"\n{'='*60}")
    print("Test Summary Report")
    print(f"{'='*60}")
    
    print(f"\n{'Test Case':<35} {'Time(s)':<12} {'Coverage':<12} {'Issues'}")
    print("-"*70)
    for r in results:
        if 'error' in r:
            print(f"{r['name']:<35} {'FAILED':<12} {'-':<12} {r['error'][:50]}")
        else:
            print(f"{r['name']:<35} {r['elapsed']:<12.2f} {r['coverage']:<12.1f}% {r['issues']}")
    
    print("\n[OK] Stress test complete!")


if __name__ == "__main__":
    main()
