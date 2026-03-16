"""
测试数据生成脚本
生成 150 名成员和他们的志愿数据，用于测试排班算法
"""
import random
from datetime import datetime

from app.database import SessionLocal
from app import models


# ============================================================================
# 配置数据
# ============================================================================

DEPARTMENTS = [
    "秘书部", "数媒营销部", "实体项目管理部", "竹铭计划项目管理办公室",
    "校园服务部", "家教家政业务部", "培训部", "网络部"
]

LEADERSHIP_POSITIONS = {"部长", "副主席", "主席"}

CHINESE_NAMES = [
    "张三", "李四", "王五", "赵六", "孙七", "周八", "吴九", "郑十",
    "刘一", "陈二", "杨三", "黄四", "何五", "林六", "高七", "郭八",
    "马九", "罗十", "梁一", "宋二", "唐三", "许四", "邓五", "冯六",
    "曾七", "彭八", "曹九", "韦十", "萧一", "尤二", "叶三", "阎四",
    "余五", "卜六", "鲍七", "史八", "唐九", "费十", "廉一", "岑二",
    "薛三", "雷四", "贺五", "倪六", "汤七", "滕八", "殷九", "罗十",
    "毕一", "聂二", "钮三", "鹿四", "苏五", "潘六", "戚七", "沈八",
    "姚九", "邵十", "湛一", "虞二", "万三", "牟四", "葛五", "邱六",
    "游七", "陆八", "舒九", "缪十", "樊一", "侯二", "项三", "祝四",
    "董五", "苏六", "朱七", "芮八", "焦九", "纪十", "丁一", "宣二",
    "贲三", "邴四", "俞五", "逢六", "盖七", "曲八", "家九", "裘十",
    "干一", "亥二", "象三", "谷四", "晋五", "楚六", "闵七", "冀八",
    "郏九", "浦十", "尉一", "中二", "栾三", "乐四", "辛五", "阚六",
    "那七", "简八", "饶九", "空十", "曾一", "毋二", "沙三", "乜四",
    "养五", "鞠六", "须七", "丰八", "巢九", "关十", "蒯一", "相二",
    "查三", "后四", "荀五", "跋六", "苌七", "折八", "麦九", "庆十",
]

# ============================================================================
# 辅助函数
# ============================================================================

def generate_student_id(index: int) -> str:
    """生成学号，从 20230001 开始"""
    return f"2023{index:04d}"


def generate_members(db) -> list:
    """生成 150 名成员"""
    members = []
    now = datetime.now()
    
    # 1. 生成 10 名部长团（8位部长 + 1位副主席 + 1位主席）
    for i in range(8):
        member = models.Member(
            student_id=generate_student_id(i + 1),
            name=random.choice(CHINESE_NAMES),
            department="部长团",
            position="部长",
            has_submitted=True,
            submit_time=now
        )
        db.add(member)
        members.append(member)
    
    # 副主席
    member = models.Member(
        student_id=generate_student_id(9),
        name=random.choice(CHINESE_NAMES),
        department="部长团",
        position="副主席",
        has_submitted=True,
        submit_time=now
    )
    db.add(member)
    members.append(member)
    
    # 主席
    member = models.Member(
        student_id=generate_student_id(10),
        name=random.choice(CHINESE_NAMES),
        department="部长团",
        position="主席",
        has_submitted=True,
        submit_time=now
    )
    db.add(member)
    members.append(member)
    
    # 2. 生成 40 名副部长
    for i in range(40):
        member = models.Member(
            student_id=generate_student_id(10 + i + 1),
            name=random.choice(CHINESE_NAMES),
            department=random.choice(DEPARTMENTS),
            position="副部长",
            has_submitted=True,
            submit_time=now
        )
        db.add(member)
        members.append(member)
    
    # 3. 生成 100 名干事
    for i in range(100):
        member = models.Member(
            student_id=generate_student_id(50 + i + 1),
            name=random.choice(CHINESE_NAMES),
            department=random.choice(DEPARTMENTS),
            position="干事",
            has_submitted=True,
            submit_time=now
        )
        db.add(member)
        members.append(member)
    
    db.commit()
    return members


def generate_preferences(db, members: list) -> None:
    """为每个成员基于现有 shifts 生成 4-6 个志愿（不修改 shifts 表）"""
    shifts = db.query(models.Shift).all()
    if not shifts:
        raise RuntimeError("数据库中 shifts 表为空：请先初始化班次数据（本脚本不会创建 shifts）。")

    other_shifts = [s for s in shifts if s.time_slot != "第三四节"]
    if not other_shifts:
        raise RuntimeError("数据库中不存在非'第三四节'的班次，无法为非副部长生成志愿。")

    for member in members:
        # 随机选择 4-6 个志愿
        num_preferences = random.randint(4, 6)
        
        if member.position == "副部长":
            # 副部长可以选择所有班次
            available_shifts = shifts
        else:
            # 其他职位只能选择非"第三四节"的班次
            available_shifts = other_shifts
        
        # 随机选择不重复的班次
        selected_shifts = random.sample(available_shifts, min(num_preferences, len(available_shifts)))
        
        # 为每个选中的班次创建 Preference 记录
        for rank, shift in enumerate(selected_shifts, start=1):
            preference = models.Preference(
                student_id=member.student_id,
                shift_id=shift.shift_id,
                preference_rank=rank
            )
            db.add(preference)
    
    db.commit()


def clear_old_data(db) -> None:
    """清空旧数据"""
    print("清空旧数据...")
    db.query(models.Preference).delete(synchronize_session=False)
    db.query(models.Schedule).delete(synchronize_session=False)
    db.query(models.Member).delete(synchronize_session=False)
    db.commit()
    print("✓ 旧数据已清空")


def main():
    """主函数"""
    db = SessionLocal()
    
    try:
        # 1. 清空旧数据
        clear_old_data(db)
        
        # 2. 生成成员
        print("生成 150 名成员...")
        members = generate_members(db)
        print(f"✓ 生成了 {len(members)} 名成员")
        
        # 统计职位分布
        positions = {}
        for m in members:
            positions[m.position] = positions.get(m.position, 0) + 1
        print(f"  职位分布: {positions}")

        # 强制修正“部长团”的部门逻辑（防止后续有人改配置导致异常）
        for m in members:
            if m.position in LEADERSHIP_POSITIONS:
                m.department = "部长团"
        db.commit()
        
        # 3. 生成志愿（基于数据库现有 shifts）
        print("生成志愿数据...")
        generate_preferences(db, members)
        
        # 统计志愿数据
        total_prefs = db.query(models.Preference).count()
        print(f"✓ 生成了 {total_prefs} 条志愿记录")
        
        # 验证权限规则
        print("\n验证权限规则...")
        vice_minister_third_fourth = db.query(models.Preference).join(
            models.Member, models.Preference.student_id == models.Member.student_id
        ).join(
            models.Shift, models.Preference.shift_id == models.Shift.shift_id
        ).filter(
            models.Member.position == "副部长",
            models.Shift.time_slot == "第三四节"
        ).count()
        print(f"✓ 副部长选择'第三四节'的志愿数: {vice_minister_third_fourth}")
        
        others_third_fourth = db.query(models.Preference).join(
            models.Member, models.Preference.student_id == models.Member.student_id
        ).join(
            models.Shift, models.Preference.shift_id == models.Shift.shift_id
        ).filter(
            models.Member.position != "副部长",
            models.Shift.time_slot == "第三四节"
        ).count()
        print(f"✓ 非副部长选择'第三四节'的志愿数: {others_third_fourth} (应为 0)")
        
        if others_third_fourth == 0:
            print("\n✅ 所有数据生成完成！权限规则验证通过。")
        else:
            print("\n⚠️ 警告：权限规则验证失败！")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
