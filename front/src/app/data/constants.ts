import { Member } from "./mockData";

// ─── Color constants ──────────────────────────────────────────────────────────

export const TIME_COLORS: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    light: string;
    ring: string;
  }
> = {
  第一二节: {
    bg: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-200",
    light: "bg-amber-50",
    ring: "ring-amber-300",
  },
  第三四节: {
    bg: "bg-sky-500",
    text: "text-sky-700",
    border: "border-sky-200",
    light: "bg-sky-50",
    ring: "ring-sky-300",
  },
  第五六节: {
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
    light: "bg-emerald-50",
    ring: "ring-emerald-300",
  },
  第七八节: {
    bg: "bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-200",
    light: "bg-violet-50",
    ring: "ring-violet-300",
  },
};

export const DEPT_COLORS: Record<string, string> = {
  网络部: "bg-blue-100 text-blue-700",
  培训部: "bg-orange-100 text-orange-700",
  秘书部: "bg-pink-100 text-pink-700",
  校园服务部: "bg-teal-100 text-teal-700",
  数媒营销部: "bg-purple-100 text-purple-700",
  家教家政业务部: "bg-lime-100 text-lime-700",
  实体项目管理部: "bg-rose-100 text-rose-700",
  "「竹铭计划」项目管理办公室": "bg-amber-100 text-amber-700",
  主席团: "bg-indigo-100 text-indigo-700",
};

export const POSITION_COLORS: Record<string, string> = {
  主席: "bg-red-100 text-red-700",
  副主席: "bg-orange-100 text-orange-700",
  部长: "bg-blue-100 text-blue-700",
  副部长: "bg-sky-100 text-sky-700",
  干事: "bg-gray-100 text-gray-600",
};

// 每个角色的目标排班数量
export const ROLE_MAX_COUNT: Record<string, number> = {
  主席: 2,
  副主席: 2,
  部长: 2,
  副部长: 2,
  干事: 1,
};

// ─── Shared helper functions ──────────────────────────────────────────────────

export function isSlotDisabled(day: string, time: string) {
  return day === "周六" && time !== "第一二节";
}

export function timeRange(time: string) {
  return time === "第一二节"
    ? "9:50–12:00"
    : time === "第三四节"
      ? "12:00–14:10"
      : time === "第五六节"
        ? "14:10–16:15"
        : "16:15–17:30";
}

// 计算班次中的人员构成
export function getHeadcount(members: Member[]) {
  let ministers = 0;
  let viceMinistersCount = 0;
  let officers = 0;
  for (const m of members) {
    if (m.position === "主席" || m.position === "副主席" || m.position === "部长") {
      ministers++;
    } else if (m.position === "副部长") {
      viceMinistersCount++;
    } else {
      officers++;
    }
  }
  return { ministers, viceMinistersCount, officers };
}

export type WeekType = "单周" | "双周";

export function memberPrefersSlot(
  member: Member | undefined,
  week: WeekType,
  day: string,
  time: string,
) {
  if (!member || !Array.isArray((member as any).shifts)) return false;
  return (member as any).shifts.some(
    (s: any) => s.week === week && s.day === day && s.time === time,
  );
}
