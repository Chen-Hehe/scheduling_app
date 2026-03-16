export interface MemberShift {
  id: string;
  week: "单周" | "双周";
  day: string;
  time: string;
}

export interface Member {
  studentId: string;
  name: string;
  department: string;
  position: string;
  submitted: boolean;
  shifts: MemberShift[]; // ordered by priority
  submitTime?: string;
}

export const ALL_MEMBERS: Member[] = [
  {
    studentId: "2022010101", name: "张梦琪", department: "网络部", position: "干事", submitted: true,
    submitTime: "2026-03-01 09:12",
    shifts: [
      { id: "s1", week: "单周", day: "周一", time: "第一二节" },
      { id: "s2", week: "单周", day: "周三", time: "第五六节" },
      { id: "s3", week: "双周", day: "周二", time: "第一二节" },
      { id: "s4", week: "双周", day: "周四", time: "第五六节" },
    ],
  },
  {
    studentId: "2022010203", name: "李浩然", department: "培训部", position: "副部长", submitted: true,
    submitTime: "2026-03-01 10:34",
    shifts: [
      { id: "s5", week: "单周", day: "周二", time: "第五六节" },
      { id: "s6", week: "单周", day: "周四", time: "第七八节" },
      { id: "s7", week: "双周", day: "周一", time: "第三四节" },
    ],
  },
  {
    studentId: "2022010312", name: "王思远", department: "秘书部", position: "部长", submitted: true,
    submitTime: "2026-03-01 11:05",
    shifts: [
      { id: "s8", week: "单周", day: "周三", time: "第一二节" },
      { id: "s9", week: "双周", day: "周三", time: "第一二节" },
      { id: "s10", week: "单周", day: "周五", time: "第五六节" },
    ],
  },
  {
    studentId: "2023020145", name: "陈雨薇", department: "校园服务部", position: "干事", submitted: true,
    submitTime: "2026-03-01 14:22",
    shifts: [
      { id: "s11", week: "单周", day: "周五", time: "第一二节" },
      { id: "s12", week: "双周", day: "周五", time: "第一二节" },
      { id: "s13", week: "单周", day: "周二", time: "第七八节" },
      { id: "s14", week: "双周", day: "周二", time: "第五六节" },
    ],
  },
  {
    studentId: "2023020267", name: "刘子轩", department: "数媒营销部", position: "干事", submitted: true,
    submitTime: "2026-03-02 08:48",
    shifts: [
      { id: "s15", week: "单周", day: "周四", time: "第一二节" },
      { id: "s16", week: "双周", day: "周四", time: "第一二节" },
      { id: "s17", week: "单周", day: "周一", time: "第五六节" },
    ],
  },
  {
    studentId: "2022030189", name: "赵雅婷", department: "家教家政业务部", position: "副部长", submitted: true,
    submitTime: "2026-03-02 09:33",
    shifts: [
      { id: "s18", week: "单周", day: "周六", time: "第一二节" },
      { id: "s19", week: "双周", day: "周六", time: "第一二节" },
      { id: "s20", week: "单周", day: "周三", time: "第三四节" },
    ],
  },
  {
    studentId: "2023030056", name: "孙文博", department: "实体项目管理部", position: "干事", submitted: true,
    submitTime: "2026-03-02 11:17",
    shifts: [
      { id: "s21", week: "单周", day: "周一", time: "第七八节" },
      { id: "s22", week: "双周", day: "周一", time: "第七八节" },
      { id: "s23", week: "单周", day: "周五", time: "第七八节" },
      { id: "s24", week: "双周", day: "周五", time: "第五六节" },
    ],
  },
  {
    studentId: "2022040234", name: "周欣怡", department: "网络部", position: "部长", submitted: true,
    submitTime: "2026-03-02 15:44",
    shifts: [
      { id: "s25", week: "单周", day: "周二", time: "第一二节" },
      { id: "s26", week: "双周", day: "周三", time: "第五六节" },
      { id: "s27", week: "单周", day: "周四", time: "第七八节" },
    ],
  },
  {
    studentId: "2023040178", name: "吴晓峰", department: "培训部", position: "干事", submitted: true,
    submitTime: "2026-03-03 09:02",
    shifts: [
      { id: "s28", week: "单周", day: "周一", time: "第七八节" },
      { id: "s29", week: "双周", day: "周一", time: "第七八节" },
      { id: "s30", week: "单周", day: "周三", time: "第七八节" },
    ],
  },
  {
    studentId: "2022050099", name: "郑子涵", department: "「竹铭计划」项目管理办公室", position: "副主席", submitted: true,
    submitTime: "2026-03-03 10:55",
    shifts: [
      { id: "s31", week: "单周", day: "周五", time: "第五六节" },
      { id: "s32", week: "双周", day: "周五", time: "第五六节" },
      { id: "s33", week: "单周", day: "周二", time: "第七八节" },
    ],
  },
  {
    studentId: "2023050221", name: "黄可欣", department: "秘书部", position: "干事", submitted: true,
    submitTime: "2026-03-03 13:28",
    shifts: [
      { id: "s34", week: "单周", day: "周四", time: "第五六节" },
      { id: "s35", week: "双周", day: "周四", time: "第七八节" },
      { id: "s36", week: "双周", day: "周二", time: "第五六节" },
    ],
  },
  {
    studentId: "2022060177", name: "林俊杰", department: "校园服务部", position: "副部长", submitted: true,
    submitTime: "2026-03-03 16:10",
    shifts: [
      { id: "s37", week: "单周", day: "周三", time: "第三四节" },
      { id: "s38", week: "双周", day: "周三", time: "第三四节" },
      { id: "s39", week: "单周", day: "周六", time: "第一二节" },
    ],
  },
  // Unsubmitted members
  {
    studentId: "2022070034", name: "陈建国", department: "数媒营销部", position: "部长",
    submitted: false, shifts: [],
  },
  {
    studentId: "2023070089", name: "许婷婷", department: "网络部", position: "干事",
    submitted: false, shifts: [],
  },
  {
    studentId: "2022080156", name: "马天宇", department: "家教家政业务部", position: "干事",
    submitted: false, shifts: [],
  },
  {
    studentId: "2023080203", name: "宋雨晴", department: "实体项目管理部", position: "干事",
    submitted: false, shifts: [],
  },
  {
    studentId: "2022090045", name: "朱晓明", department: "「竹铭计划」项目管理办公室", position: "主席",
    submitted: false, shifts: [],
  },
  {
    studentId: "2023090112", name: "徐梦雪", department: "培训部", position: "干事",
    submitted: false, shifts: [],
  },
  {
    studentId: "2022100067", name: "谢思宇", department: "秘书部", position: "副部长",
    submitted: false, shifts: [],
  },
  {
    studentId: "2023100188", name: "冯博远", department: "校园服务部", position: "干事",
    submitted: false, shifts: [],
  },
];

export const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六"];
export const TIME_SLOTS = ["第一二节", "第三四节", "第五六节", "第七八节"];

export type SlotKey = string; // `${week}-${day}-${time}`

export interface ScheduleResult {
  [slotKey: string]: Member[];
}

// Simple greedy scheduling: assign each person to their top-priority available slot
// Max 1 person per slot (can be adjusted)
export function generateSchedule(members: Member[], maxPerSlot = 2): ScheduleResult {
  const result: ScheduleResult = {};
  const slotCount: Record<string, number> = {};

  const submitted = members.filter((m) => m.submitted);

  for (const member of submitted) {
    for (const shift of member.shifts) {
      const key = `${shift.week}-${shift.day}-${shift.time}`;
      const count = slotCount[key] ?? 0;
      if (count < maxPerSlot) {
        if (!result[key]) result[key] = [];
        result[key].push(member);
        slotCount[key] = count + 1;
        break; // assigned, move to next person
      }
    }
  }

  return result;
}
