# -*- coding: utf-8 -*-
"""
Reset test data with correct Chinese encoding
"""
import sys
sys.path.insert(0, 'D:\\app_extension\\cursor_projects\\scheduling-app')

from app.database import SessionLocal
from app import models
from datetime import datetime

def reset_test_data():
    db = SessionLocal()
    try:
        # Clear all tables
        db.query(models.Schedule).delete()
        db.query(models.Preference).delete()
        db.query(models.Shift).delete()
        db.query(models.Member).delete()
        db.commit()
        print("OK: Cleared all test data")
        
        # Create test members - 扩展到 20 人，更多已提交志愿的成员
        members_data = [
            {"student_id": "20220101", "name": "张三", "department": "网络部", "position": "部长", "has_submitted": True},
            {"student_id": "20220102", "name": "李四", "department": "培训部", "position": "干事", "has_submitted": True},
            {"student_id": "20220103", "name": "王五", "department": "秘书部", "position": "副部长", "has_submitted": True},
            {"student_id": "20220104", "name": "赵六", "department": "校园服务部", "position": "部长", "has_submitted": True},
            {"student_id": "20220105", "name": "钱七", "department": "数媒营销部", "position": "干事", "has_submitted": True},
            {"student_id": "20220106", "name": "孙八", "department": "家教家政业务部", "position": "副部长", "has_submitted": True},
            {"student_id": "20220107", "name": "周九", "department": "实体项目管理部", "position": "干事", "has_submitted": True},
            {"student_id": "20220108", "name": "吴十", "department": "竹铭计划项目管理办公室", "position": "部长", "has_submitted": True},
            {"student_id": "20220109", "name": "郑一", "department": "主席团", "position": "主席", "has_submitted": True},
            {"student_id": "20220110", "name": "王二", "department": "主席团", "position": "副主席", "has_submitted": True},
            {"student_id": "20220111", "name": "陈三", "department": "网络部", "position": "干事", "has_submitted": True},
            {"student_id": "20220112", "name": "林四", "department": "培训部", "position": "干事", "has_submitted": True},
            {"student_id": "20220113", "name": "黄五", "department": "秘书部", "position": "干事", "has_submitted": True},
            {"student_id": "20220114", "name": "刘六", "department": "校园服务部", "position": "副部长", "has_submitted": True},
            {"student_id": "20220115", "name": "杨七", "department": "数媒营销部", "position": "干事", "has_submitted": True},
            {"student_id": "20220116", "name": "徐八", "department": "家教家政业务部", "position": "干事", "has_submitted": False},
            {"student_id": "20220117", "name": "马九", "department": "实体项目管理部", "position": "干事", "has_submitted": True},
            {"student_id": "20220118", "name": "朱十", "department": "竹铭计划项目管理办公室", "position": "副部长", "has_submitted": True},
            {"student_id": "20220119", "name": "胡一", "department": "主席团", "position": "干事", "has_submitted": True},
            {"student_id": "20220120", "name": "高二", "department": "网络部", "position": "干事", "has_submitted": False},
        ]
        
        for m in members_data:
            member = models.Member(
                student_id=m["student_id"],
                name=m["name"],
                department=m["department"],
                position=m["position"],
                has_submitted=m["has_submitted"],
                submit_time=datetime.now() if m["has_submitted"] else None
            )
            db.add(member)
        
        db.commit()
        print(f"OK: Created {len(members_data)} members")
        
        # Create test shifts - 完整的 42 个班次
        weeks = ["单周", "双周"]
        weekdays = ["周一", "周二", "周三", "周四", "周五"]
        time_slots_weekday = ["第一二节", "第三四节", "第五六节", "第七八节"]
        time_slots_saturday = ["第一二节"]
        
        shifts_data = []
        
        # 周一到周五：每天 4 个班次
        for week in weeks:
            for day in weekdays:
                for time_slot in time_slots_weekday:
                    shifts_data.append((week, day, time_slot))
        
        # 周六：1 个班次
        for week in weeks:
            shifts_data.append((week, "周六", "第一二节"))
        
        print(f"INFO: Total shifts to create: {len(shifts_data)}")  # 应该是 42
        
        for week, day, time_slot in shifts_data:
            shift = models.Shift(
                shift_id=f"{week}-{day}-{time_slot}",
                week=week,
                day=day,
                time_slot=time_slot,
                min_required=1
            )
            db.add(shift)
        
        db.commit()
        print(f"OK: Created {len(shifts_data)} shifts")
        
        # Create preferences for submitted members - 每人至少 4 个班次
        # 预定义不同的志愿模式，让数据更真实
        preference_patterns = [
            # 模式 1: 喜欢周一周二
            [
                ("单周", "周一", "第一二节", 1),
                ("单周", "周一", "第三四节", 2),
                ("双周", "周二", "第一二节", 3),
                ("双周", "周二", "第三四节", 4),
            ],
            # 模式 2: 喜欢周三周四
            [
                ("单周", "周三", "第五六节", 1),
                ("双周", "周三", "第七八节", 2),
                ("单周", "周四", "第一二节", 3),
                ("双周", "周四", "第三四节", 4),
            ],
            # 模式 3: 喜欢下午和晚上
            [
                ("单周", "周二", "第五六节", 1),
                ("单周", "周三", "第七八节", 2),
                ("双周", "周四", "第五六节", 3),
                ("双周", "周五", "第七八节", 4),
            ],
            # 模式 4: 喜欢上午
            [
                ("单周", "周一", "第一二节", 1),
                ("双周", "周二", "第一二节", 2),
                ("单周", "周三", "第三四节", 3),
                ("双周", "周四", "第一二节", 4),
            ],
            # 模式 5: 周五和周六
            [
                ("单周", "周五", "第一二节", 1),
                ("单周", "周五", "第三四节", 2),
                ("双周", "周五", "第五六节", 3),
                ("单周", "周六", "第一二节", 4),
            ],
            # 模式 6: 分散在各天
            [
                ("单周", "周一", "第五六节", 1),
                ("双周", "周三", "第一二节", 2),
                ("单周", "周四", "第七八节", 3),
                ("双周", "周五", "第三四节", 4),
            ],
            # 模式 7: 喜欢晚上
            [
                ("单周", "周二", "第七八节", 1),
                ("双周", "周三", "第七八节", 2),
                ("单周", "周四", "第七八节", 3),
                ("双周", "周五", "第七八节", 4),
            ],
        ]
        
        submitted_members = db.query(models.Member).filter(models.Member.has_submitted == True).all()
        pref_count = 0
        
        for idx, member in enumerate(submitted_members):
            # 循环使用不同的志愿模式
            pattern = preference_patterns[idx % len(preference_patterns)]
            
            for week, day, time_slot, rank in pattern:
                shift_id = f"{week}-{day}-{time_slot}"
                pref = models.Preference(
                    student_id=member.student_id,
                    shift_id=shift_id,
                    preference_rank=rank
                )
                db.add(pref)
                pref_count += 1
        
        db.commit()
        print(f"OK: Created {pref_count} preferences for {len(submitted_members)} members")
        
        print("\n" + "=" * 60)
        print("Test data reset completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_test_data()
