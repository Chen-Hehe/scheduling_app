个人排班微调弹窗 (Personal Schedule Adjustment Modal)
【模块背景】
在管理员的可视化排班结果页面中，由于算法已经完成了初始排班，大多数人的排班量（进度）已满。当管理员需要进行人工微调时，采用“以人为中心”的调整逻辑。点击任意人员名字，弹出该人员的专属调整窗口，通过表格直观展示其志愿和各班次现状，实现便捷的“移出A班次、加入B班次”操作。

📦 一、 数据结构定义 (Data Interfaces)
为了渲染该弹窗，前端需要接收类似如下的数据结构：

TypeScript
// 弹窗所需的个人全景数据
interface PersonalAdjustmentData {
  student_id: string;
  name: string;
  role: '部长团' | '副部长' | '干事';
  current_count: number; // 当前已排班次数量
  max_count: number;     // 该角色的目标班次数量（如部长为2，干事为1）
  
  // 该人员相关的所有班次列表（包含已排上的，以及未排上但填了志愿的）
  related_shifts: Array<{
    shift_id: string;
    time_slot: string; // 班次时间，例如 "单周 周一 14:00-16:00"
    preference_rank: number | null; // 志愿等级：1, 2, 3... null表示未填报该志愿但被调剂
    is_assigned: boolean; // 当前是否被安排在该班次
    // 该班次当前的已排人员构成（关键决策信息）
    headcount: {
      ministers: number;    // 部长团人数
      vice_ministers: number; // 副部长人数
      officers: number;     // 干事人数
    }
  }>;
}
🎨 二、 弹窗 UI 布局设计 (Modal Layout)
弹窗头部 (Header)

左侧标题：显示 [姓名] - 排班微调 以及人员所属的 [职位 Tag]（例如：张三 - 部长团）。

右上角进度指示器：醒目展示当前的 “排班进度：X / Y”（例如：2 / 2）。

动态样式：当 X < Y 时，文字或背景显示为警告色（如橙色）；当 X == Y 时，显示为成功色（如绿色）；当 X > Y 时，显示为危险色（如红色，提示超排）。

弹窗主体 (Body - Table)

使用数据表格（Table 组件）完整展示 related_shifts 数组的数据。

表格列定义 (Columns)：

班次时间：展示具体的单双周及时间段。

志愿等级：展示“第1志愿”、“第2志愿”等。可通过排序功能，默认将第1志愿排在最前面。

当前班次人数概览：以微型 Tag 或文本组合形式展示该班次的现状。例如：部: 2 | 副: 1 | 干: 1。这能帮助管理员判断“如果我把这个人从这里移出，这个班次会不会缺人”。

操作 (Action / Switch)：一个切换开关 (Switch) 或 “选择/取消选择” 按钮。绑定 is_assigned 状态。

⚙️ 三、 核心交互逻辑 (Interaction Logic)
状态实时联动：

当管理员在表格中点击“选择/加入”某个班次时，该行的 is_assigned 变为 true。同时，右上角的排班进度分子 (current_count) 立即 +1。

当点击“取消选择/移出”时，该行的 is_assigned 变为 false。右上角的排班进度分子 -1。

注意：前端不需要做硬性的“禁止超排”拦截，只需通过右上角的颜色变红来提示管理员当前处于超排状态即可。决策权完全交给管理员。

数据提交 (Save & Apply)：

弹窗底部提供“取消”和“确认修改”按钮。

管理员通过表格的开关，轻松完成“取消A班次，勾选B班次”的无缝换班操作。

点击“确认修改”时，前端提取当前表格中所有 is_assigned === true 的 shift_id 数组，连同该用户的 student_id，发起 POST/PUT 请求给后端，覆盖该用户的排班记录。

请求成功后，关闭弹窗，并刷新底层的全局排班表视图。