# 排班算法改动总结

## 核心改动

### 1. 后端算法逻辑（`app/main.py`）

**改动前：**
- 每个班次分为"领导位"和"普通位"两个子节点
- 每个人最多被分配到 `capacity` 次（可能不满）
- 算法目标：最小化总费用，但不强制每个人都被分配满

**改动后：**
- 简化班次结构：每个班次只有一个节点
- **关键改变：每个人必须被分配到他们的 `capacity` 上限**
- 算法目标：在满足"每个班次至少 `min_required` 人"和"每个人恰好 `capacity` 次"的约束下，最小化总费用

**具体实现：**
```python
# 源点 -> 成员：容量 = capacity（必须全部用完）
G.add_edge("S", f"M_{m.student_id}", capacity=member_capacity[m.student_id], weight=0)

# 班次 -> 汇点：容量 = 总容量（理论无上限）
G.add_edge(f"Shift_{s.shift_id}", "T", capacity=total_capacity, weight=0)

# 成员 -> 班次：容量 = 1（每个班次最多分配一次）
G.add_edge(mid_node, f"Shift_{s.shift_id}", capacity=1, weight=base_weight)
```

**可行性检查：**
- 总容量 ≥ 班次总需求（否则无法满足所有班次的最低人数）
- 实际分配流量 = 总容量（确保每个人都被分配满）
- 每个班次实际分配 ≥ `min_required`（确保每个班次满足最低需求）

### 2. 前端 UI 改动（`front/src/app/components/admin/AdminSchedule.tsx` 和 `constants.ts`）

**改动前：**
- 常量 `MAX_PER_SLOT = 2`：每个班次最多 2 人
- 班次编辑弹窗中有"已满"提示
- 添加人员时检查是否达到上限

**改动后：**
- **删除 `MAX_PER_SLOT` 常量**
- 班次编辑弹窗中移除"已满"提示
- 添加人员时无上限检查
- 班次可以容纳任意数量的人员

**具体改动位置：**
1. `constants.ts`：删除 `export const MAX_PER_SLOT = 2;`
2. `AdminSchedule.tsx` 导入：移除 `MAX_PER_SLOT`
3. `PersonalAdjustmentModal`：移除"满"标记
4. `SlotEditModal`：
   - 移除 `isFull` 变量
   - 移除"已满"提示
   - 移除添加按钮的 `isFull` 条件
5. `ScheduleTable`：移除"已满"显示
6. `handleAddMember`：移除容量检查
7. 说明文本：改为"每个成员将被分配到其岗位对应的班次数量"

## 语义变化

| 概念 | 改动前 | 改动后 |
|------|--------|--------|
| `Shift.min_required` | 班次最少需要的人数 | 班次最少需要的人数（下限） |
| 班次人数上限 | `MAX_PER_SLOT = 2` | 无上限 |
| 每个人的分配 | 最多 `capacity` 次 | **恰好 `capacity` 次** |
| 算法目标 | 最小化费用（可能不满） | 在满足约束下最小化费用 |

## 约束条件

新算法必须满足以下条件才能成功生成排班：

1. **总容量 ≥ 班次总需求**
   ```
   sum(member_capacity) ≥ sum(shift.min_required)
   ```
   否则无法满足所有班次的最低人数要求。

2. **每个班次至少 `min_required` 人**
   ```
   actual_assigned[shift_id] ≥ shift.min_required
   ```

3. **每个人恰好被分配 `capacity` 次**
   ```
   assigned_count[student_id] = capacity[student_id]
   ```

## 错误处理

后端新增以下错误检查：

1. **总容量不足**：返回 400 错误，提示总容量 < 班次总需求
2. **排班不完整**：返回 500 错误，提示实际分配 < 总容量
3. **班次未满足最低需求**：返回 500 错误，提示具体哪个班次缺人

## 测试建议

1. **基础测试**：确保成员总容量 ≥ 班次总需求
   - 例：5 名成员（2+2+1），班次需求总和 ≤ 5

2. **边界测试**：总容量 = 班次总需求
   - 验证每个人都被分配满，每个班次都恰好满足需求

3. **超额测试**：总容量 > 班次总需求
   - 验证多余的容量被合理分配

4. **志愿优先级测试**：
   - 验证在满足约束的前提下，优先分配志愿班次
   - 验证未填志愿的班次作为调剂

5. **UI 测试**：
   - 验证班次编辑弹窗可以添加任意数量的人员
   - 验证没有"已满"提示
