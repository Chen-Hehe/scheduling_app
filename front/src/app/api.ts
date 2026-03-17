import { Member, ScheduleResult } from "./data/mockData";

// 后端服务地址，如与前端同源可改为空字符串 "" 或从环境变量读取
const API_BASE_URL = "http://127.0.0.1:8000";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${input}`, {
    headers: {
      ...(init?.headers || {}),
    },
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    console.error("API error", input, res.status, detail);
    throw new Error(
      typeof detail === "string"
        ? detail
        : (detail as any)?.detail ?? `Request failed with status ${res.status}`
    );
  }

  // 部分接口可能没有响应体
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// ============ C 端：成员校验与志愿提交 ============

export interface MemberCheckResponse {
  studentId: string;
  name: string;
  department: string;
  position: string;
  hasSubmitted: boolean;
}

export interface PreferenceShiftPayload {
  shift_id: string;
  rank: number;
}

export interface PreferencesSubmitRequest {
  student_id: string;
  shifts: PreferenceShiftPayload[];
}

export interface MessageResponse {
  message: string;
}

export async function apiCheckMember(studentId: string, name: string) {
  const params = new URLSearchParams({ student_id: studentId, name });
  return request<MemberCheckResponse>(`/api/members/check?${params.toString()}`);
}

export async function apiSubmitPreferences(payload: PreferencesSubmitRequest) {
  return request<MessageResponse>(`/api/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ============ B 端：花名册与进度 ============

export interface RosterStatusResponse {
  submitted_members: Member[];
  unsubmitted_members: Member[];
}

export async function apiImportRoster(
  file: File,
  mode: "replace" | "append" = "append",
) {
  const form = new FormData();
  form.append("file", file);

  const params = new URLSearchParams({ mode });

  return request<MessageResponse>(
    `/api/admin/roster/import?${params.toString()}`,
    {
      method: "POST",
      body: form,
    },
  );
}

export async function apiGetRosterStatus() {
  return request<RosterStatusResponse>(`/api/admin/roster/status`);
}

// ============ B 端：排班生成与查看 ============

export async function apiGenerateSchedule() {
  return request<MessageResponse>(`/api/admin/schedule/generate`, {
    method: "POST",
  });
}

export async function apiGetSchedule() {
  // 后端返回的结构已与 ScheduleResult 兼容：key 为 slotKey，值为 Member[]
  // 每个成员包含 is_leader 字段标识组长
  return request<ScheduleResult>(`/api/admin/schedule`);
}

// ============ B 端：个人微调 ============

export interface Headcount {
  ministers: number;
  vice_ministers: number;
  officers: number;
}

export interface RelatedShift {
  shift_id: string;
  time_slot: string;
  preference_rank: number | null;
  is_assigned: boolean;
  headcount: Headcount;
}

export interface PersonalAdjustmentData {
  student_id: string;
  name: string;
  role: string;
  current_count: number;
  max_count: number;
  related_shifts: RelatedShift[];
}

export interface PersonalAdjustmentUpdateRequest {
  assigned_shift_ids: string[];
  leader_shift_ids?: string[]; // shift_ids where this person is the leader
}

export async function apiGetPersonalAdjustment(studentId: string) {
  return request<PersonalAdjustmentData>(
    `/api/admin/schedule/personal/${encodeURIComponent(studentId)}`
  );
}

export async function apiUpdatePersonalAdjustment(
  studentId: string,
  payload: PersonalAdjustmentUpdateRequest
) {
  return request<MessageResponse>(
    `/api/admin/schedule/personal/${encodeURIComponent(studentId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

// ============ B 端：全局班次最少人数配置 ============

export interface MinRequiredConfig {
  min_required: number;
}

export async function apiGetGlobalMinRequired() {
  return request<MinRequiredConfig>(`/api/admin/shifts/min-required`);
}

export async function apiUpdateGlobalMinRequired(payload: MinRequiredConfig) {
  return request<MessageResponse>(`/api/admin/shifts/min-required`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

