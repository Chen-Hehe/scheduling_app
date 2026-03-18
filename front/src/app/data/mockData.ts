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
  is_leader?: boolean; // true if this member is the designated leader for this slot
}

export const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六"];
export const TIME_SLOTS = ["第一二节", "第三四节", "第五六节", "第七八节"];

export type SlotKey = string; // `${week}-${day}-${time}`

export interface ScheduleResult {
  [slotKey: string]: Member[];
}
