import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useMembers } from "../../context/MemberContext";
import {
  DAYS,
  TIME_SLOTS,
  generateSchedule,
  ScheduleResult,
  Member,
} from "../../data/mockData";
import {
  Users,
  UserCheck,
  UserX,
  Bell,
  Zap,
  Download,
  LogOut,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Clock,
  LayoutGrid,
  RefreshCw,
  TableProperties,
  Printer,
  Pencil,
  X,
  Check,
  AlertTriangle,
  Copy,
  Search,
  ToggleLeft,
  ToggleRight,
  User,
  Plus,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ─── constants ────────────────────────────────────────────────────────────────

const TIME_COLORS: Record<
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

const DEPT_COLORS: Record<string, string> = {
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

const POSITION_COLORS: Record<string, string> = {
  主席: "bg-red-100 text-red-700",
  副主席: "bg-orange-100 text-orange-700",
  部长: "bg-blue-100 text-blue-700",
  副部长: "bg-sky-100 text-sky-700",
  干事: "bg-gray-100 text-gray-600",
};

// 每个角色的目标排班数量
const ROLE_MAX_COUNT: Record<string, number> = {
  主席: 2,
  副主席: 2,
  部长: 2,
  副部长: 2,
  干事: 1,
};

const MAX_PER_SLOT = 2;

type ActiveTab = "dashboard" | "schedule";
type WeekType = "单周" | "双周";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isSlotDisabled(day: string, time: string) {
  return day === "周六" && time !== "第一二节";
}

function timeRange(time: string) {
  return time === "第一二节"
    ? "9:50–12:00"
    : time === "第三四节"
      ? "12:00–14:10"
      : time === "第五六节"
        ? "14:10–16:15"
        : "16:15–17:30";
}

// 计算班次中的人员构成
function getHeadcount(members: Member[]) {
  let ministers = 0;
  let viceMinistersCount = 0;
  let officers = 0;
  for (const m of members) {
    if (
      m.position === "部长" ||
      m.position === "主席" ||
      m.position === "副主席"
    ) {
      ministers++;
    } else if (m.position === "副部长") {
      viceMinistersCount++;
    } else {
      officers++;
    }
  }
  return { ministers, viceMinistersCount, officers };
}

function memberPrefersSlot(
  member: Member,
  week: WeekType,
  day: string,
  time: string,
) {
  return member.shifts.some(
    (s) => s.week === week && s.day === day && s.time === time,
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p
          className="text-gray-800"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-gray-400 text-xs mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

function UnsubmittedList({ members }: { members: Member[] }) {
  const [expanded, setExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const display = expanded ? members : members.slice(0, 5);

  const handleCopyNames = async () => {
    const names = members.map((m) => `@${m.name}`).join(" ");
    try {
      await navigator.clipboard.writeText(names);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = names;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          <h3
            className="text-gray-700"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            未提交提醒
          </h3>
          <span
            className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full"
            style={{ fontWeight: 600 }}
          >
            {members.length} 人
          </span>
        </div>
        <button
          onClick={handleCopyNames}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
            copySuccess
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
          }`}
          style={{ fontWeight: 500 }}
        >
          {copySuccess ? (
            <>
              <Check className="w-3 h-3" />
              复制成功
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              一键复制未交名单
            </>
          )}
        </button>
      </div>
      <div className="space-y-2">
        {display.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-3 py-2.5 bg-orange-50/60 rounded-xl border border-orange-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
                <span
                  className="text-orange-700 text-xs"
                  style={{ fontWeight: 700 }}
                >
                  {m.name[0]}
                </span>
              </div>
              <div>
                <p
                  className="text-gray-700 text-sm"
                  style={{ fontWeight: 500 }}
                >
                  {m.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {m.studentId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}
              >
                {m.department}
              </span>
              <span className="flex items-center gap-1 text-orange-400 text-xs">
                <Clock className="w-3 h-3" />
                待提交
              </span>
            </div>
          </div>
        ))}
      </div>
      {members.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "收起" : `展开全部 ${members.length} 人`}
        </button>
      )}
    </div>
  );
}

function SubmittedList({ members }: { members: Member[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <h3
          className="text-gray-700"
          style={{ fontSize: "14px", fontWeight: 600 }}
        >
          已提交名单
        </h3>
        <span
          className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full"
          style={{ fontWeight: 600 }}
        >
          {members.length} 人
        </span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-3 py-2.5 bg-green-50/60 rounded-xl border border-green-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                <span
                  className="text-green-700 text-xs"
                  style={{ fontWeight: 700 }}
                >
                  {m.name[0]}
                </span>
              </div>
              <div>
                <p
                  className="text-gray-700 text-sm"
                  style={{ fontWeight: 500 }}
                >
                  {m.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {m.submitTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}
              >
                {m.department}
              </span>
              <span className="text-xs text-gray-400">
                {m.shifts.length} 志愿
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Personal Adjustment Modal (以人为中心) ────────────────────────────────────

interface RelatedShift {
  slotKey: string;
  weekType: WeekType;
  day: string;
  time: string;
  preferenceRank: number | null; // null = 调剂（未填志愿但被安排）
  isAssigned: boolean;
  headcount: {
    ministers: number;
    viceMinistersCount: number;
    officers: number;
  };
}

function PersonalAdjustmentModal({
  member,
  scheduleResult,
  onApply,
  onClose,
}: {
  member: Member;
  scheduleResult: ScheduleResult;
  onApply: (
    memberId: string,
    assignedSlotKeys: string[],
    removedSlotKeys: string[],
  ) => void;
  onClose: () => void;
}) {
  // Build related_shifts: member's preferences + any currently assigned slots
  const buildRelatedShifts = (): RelatedShift[] => {
    const shiftsMap = new Map<string, RelatedShift>();

    // 1. Add all preference shifts
    member.shifts.forEach((s, idx) => {
      const slotKey = `${s.week}-${s.day}-${s.time}`;
      const assigned = scheduleResult[slotKey] ?? [];
      const isAssigned = assigned.some(
        (m) => m.id === member.id,
      );
      const hc = getHeadcount(assigned);
      shiftsMap.set(slotKey, {
        slotKey,
        weekType: s.week,
        day: s.day,
        time: s.time,
        preferenceRank: idx + 1,
        isAssigned,
        headcount: hc,
      });
    });

    // 2. Add any assigned slots not in preferences (调剂)
    for (const [slotKey, members] of Object.entries(
      scheduleResult,
    )) {
      if (
        members.some((m) => m.id === member.id) &&
        !shiftsMap.has(slotKey)
      ) {
        const parts = slotKey.split("-");
        const weekType = parts[0] as WeekType;
        const day = parts[1];
        const time = parts[2];
        const hc = getHeadcount(members);
        shiftsMap.set(slotKey, {
          slotKey,
          weekType,
          day,
          time,
          preferenceRank: null,
          isAssigned: true,
          headcount: hc,
        });
      }
    }

    // Sort by preference rank (志愿 first), then by null (调剂 last)
    return Array.from(shiftsMap.values()).sort((a, b) => {
      if (
        a.preferenceRank === null &&
        b.preferenceRank === null
      )
        return 0;
      if (a.preferenceRank === null) return 1;
      if (b.preferenceRank === null) return -1;
      return a.preferenceRank - b.preferenceRank;
    });
  };

  const [relatedShifts, setRelatedShifts] = useState<
    RelatedShift[]
  >(buildRelatedShifts);

  // Track original assignment state for change detection
  const originalAssignment = useRef(
    new Set(
      buildRelatedShifts()
        .filter((s) => s.isAssigned)
        .map((s) => s.slotKey),
    ),
  );

  const maxCount = ROLE_MAX_COUNT[member.position] ?? 1;
  const currentCount = relatedShifts.filter(
    (s) => s.isAssigned,
  ).length;

  // Progress color
  const progressColor =
    currentCount < maxCount
      ? "text-orange-500 bg-orange-50 border-orange-200"
      : currentCount === maxCount
        ? "text-green-600 bg-green-50 border-green-200"
        : "text-red-500 bg-red-50 border-red-200";

  const progressDotColor =
    currentCount < maxCount
      ? "bg-orange-400"
      : currentCount === maxCount
        ? "bg-green-500"
        : "bg-red-500";

  const toggleShift = (slotKey: string) => {
    setRelatedShifts((prev) =>
      prev.map((s) =>
        s.slotKey === slotKey
          ? { ...s, isAssigned: !s.isAssigned }
          : s,
      ),
    );
  };

  const handleConfirm = () => {
    const nowAssigned = new Set(
      relatedShifts
        .filter((s) => s.isAssigned)
        .map((s) => s.slotKey),
    );
    const orig = originalAssignment.current;

    // Newly assigned slots
    const added: string[] = [];
    nowAssigned.forEach((k) => {
      if (!orig.has(k)) added.push(k);
    });

    // Removed slots
    const removed: string[] = [];
    orig.forEach((k) => {
      if (!nowAssigned.has(k)) removed.push(k);
    });

    onApply(member.id, added, removed);
    onClose();
  };

  // Check if any changes were made
  const hasChanges = useMemo(() => {
    const nowAssigned = new Set(
      relatedShifts
        .filter((s) => s.isAssigned)
        .map((s) => s.slotKey),
    );
    const orig = originalAssignment.current;
    if (nowAssigned.size !== orig.size) return true;
    for (const k of nowAssigned) {
      if (!orig.has(k)) return true;
    }
    return false;
  }, [relatedShifts]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[88vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span
                  className="text-white text-sm"
                  style={{ fontWeight: 700 }}
                >
                  {member.name[0]}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className="text-gray-800"
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {member.name}
                  </h3>
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-500 text-sm">
                    排班微调
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${POSITION_COLORS[member.position] ?? "bg-gray-100 text-gray-500"}`}
                    style={{ fontWeight: 600 }}
                  >
                    {member.position}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  {member.department} · {member.studentId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Indicator */}
              <div
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${progressColor}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${progressDotColor} ${currentCount !== maxCount ? "animate-pulse" : ""}`}
                />
                <div className="text-center">
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                    }}
                    className="opacity-70"
                  >
                    排班进度
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {currentCount}{" "}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                      }}
                    >
                      /
                    </span>{" "}
                    {maxCount}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body: Shift Table ── */}
        <div className="flex-1 overflow-y-auto">
          {relatedShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">
                该成员无相关班次数据
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="px-5 py-3 text-left text-gray-500 text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    班次时间
                  </th>
                  <th
                    className="px-4 py-3 text-center text-gray-500 text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    志愿等级
                  </th>
                  <th
                    className="px-4 py-3 text-center text-gray-500 text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    当前班次人数
                  </th>
                  <th
                    className="px-5 py-3 text-center text-gray-500 text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatedShifts.map((shift) => {
                  const tc =
                    TIME_COLORS[shift.time] ??
                    TIME_COLORS["第一二节"];
                  // Recalculate headcount considering local toggle state
                  const currentSlotMembers =
                    scheduleResult[shift.slotKey] ?? [];
                  const wasAssigned = currentSlotMembers.some(
                    (m) => m.id === member.id,
                  );

                  let adjustedHc = { ...shift.headcount };
                  const isMinister =
                    member.position === "部长" ||
                    member.position === "主席" ||
                    member.position === "副主席";
                  const isVice = member.position === "副部长";

                  // If toggle changed from original, adjust headcount preview
                  if (shift.isAssigned && !wasAssigned) {
                    // Will be added
                    if (isMinister) adjustedHc.ministers++;
                    else if (isVice)
                      adjustedHc.viceMinistersCount++;
                    else adjustedHc.officers++;
                  } else if (!shift.isAssigned && wasAssigned) {
                    // Will be removed
                    if (isMinister)
                      adjustedHc.ministers = Math.max(
                        0,
                        adjustedHc.ministers - 1,
                      );
                    else if (isVice)
                      adjustedHc.viceMinistersCount = Math.max(
                        0,
                        adjustedHc.viceMinistersCount - 1,
                      );
                    else
                      adjustedHc.officers = Math.max(
                        0,
                        adjustedHc.officers - 1,
                      );
                  }

                  const totalPeople =
                    adjustedHc.ministers +
                    adjustedHc.viceMinistersCount +
                    adjustedHc.officers;

                  return (
                    <tr
                      key={shift.slotKey}
                      className={`border-b border-gray-100 transition-colors ${
                        shift.isAssigned
                          ? `${tc.light}`
                          : "bg-white hover:bg-gray-50/50"
                      }`}
                    >
                      {/* 班次时间 */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${tc.bg}`}
                          />
                          <div>
                            <p
                              className="text-gray-700"
                              style={{
                                fontWeight: 600,
                                fontSize: "13px",
                              }}
                            >
                              {shift.weekType} · {shift.day}
                            </p>
                            <p
                              className="text-gray-400"
                              style={{ fontSize: "11px" }}
                            >
                              {shift.time} (
                              {timeRange(shift.time)})
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 志愿等级 */}
                      <td className="px-4 py-3.5 text-center">
                        {shift.preferenceRank !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                              shift.preferenceRank === 1
                                ? "bg-blue-100 text-blue-700"
                                : shift.preferenceRank === 2
                                  ? "bg-blue-50 text-blue-600"
                                  : shift.preferenceRank <= 4
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-gray-50 text-gray-400"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            第{shift.preferenceRank}志愿
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-500"
                            style={{ fontWeight: 500 }}
                          >
                            调剂
                          </span>
                        )}
                      </td>

                      {/* 当前班次人数概览 */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                            style={{
                              fontWeight: 600,
                              fontSize: "10px",
                            }}
                          >
                            部 {adjustedHc.ministers}
                          </span>
                          <span className="text-gray-200">
                            |
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-xs bg-sky-50 text-sky-600"
                            style={{
                              fontWeight: 600,
                              fontSize: "10px",
                            }}
                          >
                            副 {adjustedHc.viceMinistersCount}
                          </span>
                          <span className="text-gray-200">
                            |
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                            style={{
                              fontWeight: 600,
                              fontSize: "10px",
                            }}
                          >
                            干 {adjustedHc.officers}
                          </span>
                          {totalPeople >= MAX_PER_SLOT && (
                            <span
                              className="ml-1 text-orange-400"
                              style={{ fontSize: "10px" }}
                            >
                              满
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 操作 Toggle */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() =>
                            toggleShift(shift.slotKey)
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                            shift.isAssigned
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {shift.isAssigned ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              已安排
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              未安排
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {hasChanges && (
              <div className="flex items-center gap-1.5 text-orange-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 500 }}>
                  有未保存的修改
                </span>
              </div>
            )}
            {currentCount > maxCount && (
              <div className="flex items-center gap-1.5 text-red-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 500 }}>
                  当前处于超排状态 ({currentCount}/{maxCount})
                </span>
              </div>
            )}
            {currentCount < maxCount && (
              <div className="flex items-center gap-1.5 text-orange-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 500 }}>
                  排班未满 ({currentCount}/{maxCount})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
              style={{ fontWeight: 500 }}
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasChanges}
              className={`px-5 py-2 rounded-xl text-xs transition-all duration-200 ${
                hasChanges
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontWeight: 600 }}
            >
              确认修改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Edit Modal (以班次为中心 - Layer 1) ──────────────────────────────────

function SlotEditModal({
  week,
  day,
  time,
  slotKey,
  currentMembers,
  scheduleResult,
  onRemove,
  onAdd,
  onMemberClick,
  onClose,
}: {
  week: WeekType;
  day: string;
  time: string;
  slotKey: string;
  currentMembers: Member[];
  scheduleResult: ScheduleResult;
  onRemove: (slotKey: string, memberId: string) => void;
  onAdd: (slotKey: string, member: Member) => void;
  onMemberClick: (member: Member) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const tc = TIME_COLORS[time];
  const { allMembers } = useMembers();

  const submitted = allMembers.filter((m) => m.submitted);
  const currentIds = new Set(currentMembers.map((m) => m.id));
  const available = submitted.filter(
    (m) => !currentIds.has(m.id),
  );

  const filtered = available.filter(
    (m) =>
      m.name.includes(search) ||
      m.department.includes(search) ||
      m.studentId.includes(search),
  );

  // Sort: prefers slot first
  const sorted = [...filtered].sort((a, b) => {
    const ap = memberPrefersSlot(a, week, day, time) ? 0 : 1;
    const bp = memberPrefersSlot(b, week, day, time) ? 0 : 1;
    return ap - bp;
  });

  const isFull = currentMembers.length >= MAX_PER_SLOT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`${tc.light} border-b border-gray-200 px-6 py-4`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-3 h-3 rounded-full ${tc.bg}`}
                />
                <h3
                  className="text-gray-800"
                  style={{ fontSize: "15px", fontWeight: 700 }}
                >
                  {week} · {day} · {time}
                </h3>
              </div>
              <p className="text-gray-400 text-xs">
                {timeRange(time)} · 已安排{" "}
                {currentMembers.length}/{MAX_PER_SLOT} 人
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Current members */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p
              className="text-gray-500 text-xs mb-3"
              style={{ fontWeight: 600 }}
            >
              当前安排人员
            </p>
            {currentMembers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-300 text-xs">
                  暂无安排人员
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentMembers.map((m) => {
                  const prefers = memberPrefersSlot(
                    m,
                    week,
                    day,
                    time,
                  );
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 group"
                    >
                      <button
                        onClick={() => onMemberClick(m)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <div
                          className={`w-8 h-8 rounded-full ${tc.bg} flex items-center justify-center shrink-0`}
                        >
                          <span
                            className="text-white text-xs"
                            style={{ fontWeight: 700 }}
                          >
                            {m.name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-gray-700 text-sm underline decoration-dotted underline-offset-2"
                              style={{ fontWeight: 500 }}
                            >
                              {m.name}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${POSITION_COLORS[m.position] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              {m.position}
                            </span>
                            {prefers && (
                              <span
                                className="text-amber-500 text-xs"
                                title="该成员填写了此志愿"
                              >
                                ★
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">
                            {m.department} · {m.studentId}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      </button>
                      <button
                        onClick={() => onRemove(slotKey, m.id)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs transition-colors ml-2"
                        style={{ fontWeight: 500 }}
                      >
                        <X className="w-3 h-3" />
                        移除
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available members to add */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-gray-500 text-xs"
                style={{ fontWeight: 600 }}
              >
                可添加人员
                {isFull && (
                  <span className="ml-2 text-orange-500">
                    (已满 {MAX_PER_SLOT} 人)
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <span className="text-amber-500">★</span> =
                已填写该志愿
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="搜索姓名 / 学号 / 部门…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {sorted.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">
                  无可添加成员
                </p>
              ) : (
                sorted.map((m) => {
                  const prefers = memberPrefersSlot(
                    m,
                    week,
                    day,
                    time,
                  );
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                        isFull
                          ? "opacity-40 bg-gray-50"
                          : prefers
                            ? "bg-amber-50/50 border border-amber-100"
                            : "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <button
                        onClick={() => onMemberClick(m)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span
                            className="text-gray-600"
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {m.name[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-gray-700 text-xs truncate underline decoration-dotted underline-offset-2"
                              style={{ fontWeight: 500 }}
                            >
                              {m.name}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${POSITION_COLORS[m.position] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              {m.position}
                            </span>
                            {prefers && (
                              <span
                                className="shrink-0 text-amber-500 text-xs"
                                title="该成员填写了此志愿"
                              >
                                ★
                              </span>
                            )}
                          </div>
                          <p
                            className="text-gray-400 truncate"
                            style={{ fontSize: "10px" }}
                          >
                            {m.department} · {m.studentId}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      </button>
                      {!isFull && (
                        <button
                          onClick={() => onAdd(slotKey, m)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 text-xs transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Table ────────────────────────────────────────────────────────────

function ScheduleTable({
  result,
  week,
  editMode,
  modifiedSlots,
  onCellClick,
}: {
  result: ScheduleResult;
  week: WeekType;
  editMode: boolean;
  modifiedSlots: Set<string>;
  onCellClick: (
    slotKey: string,
    week: WeekType,
    day: string,
    time: string,
  ) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: "640px" }}
      >
        <thead>
          <tr>
            <th
              className="bg-gray-50 border border-gray-200 px-3 py-3 text-left text-gray-500 text-xs w-28"
              style={{ fontWeight: 600 }}
            >
              节次 / 星期
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className={`border border-gray-200 px-3 py-3 text-center text-xs ${
                  day === "周六"
                    ? "bg-red-50 text-red-400"
                    : "bg-gray-50 text-gray-500"
                }`}
                style={{ fontWeight: 600 }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((time) => {
            const tc = TIME_COLORS[time];
            return (
              <tr key={time}>
                <td
                  className={`border border-gray-200 px-3 py-3 ${tc.light}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${tc.bg}`}
                    />
                    <div>
                      <p
                        className={`text-xs ${tc.text}`}
                        style={{ fontWeight: 700 }}
                      >
                        {time}
                      </p>
                      <p
                        className="text-gray-400"
                        style={{ fontSize: "10px" }}
                      >
                        {timeRange(time)}
                      </p>
                    </div>
                  </div>
                </td>

                {DAYS.map((day) => {
                  const disabled = isSlotDisabled(day, time);
                  const slotKey = `${week}-${day}-${time}`;
                  const assigned: Member[] =
                    result[slotKey] ?? [];
                  const isModified = modifiedSlots.has(slotKey);

                  return (
                    <td
                      key={day}
                      className={`border border-gray-200 px-2 py-2 align-top transition-colors relative ${
                        disabled
                          ? "bg-gray-50"
                          : editMode
                            ? `${assigned.length > 0 ? tc.light : "bg-white"} cursor-pointer hover:ring-2 hover:ring-inset hover:${tc.ring} ${isModified ? `ring-2 ring-inset ${tc.ring}` : ""}`
                            : isModified
                              ? `${tc.light} ring-2 ring-inset ${tc.ring}`
                              : assigned.length > 0
                                ? tc.light
                                : "bg-white"
                      }`}
                      style={{
                        minHeight: "64px",
                        minWidth: "90px",
                      }}
                      onClick={() => {
                        if (editMode && !disabled) {
                          onCellClick(slotKey, week, day, time);
                        }
                      }}
                    >
                      {disabled ? (
                        <div className="flex items-center justify-center h-10">
                          <span className="text-gray-200 text-xs">
                            —
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {assigned.map((m) => (
                            <div
                              key={m.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${tc.light} border ${tc.border}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full ${tc.bg} flex items-center justify-center shrink-0`}
                              >
                                <span
                                  className="text-white"
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {m.name[0]}
                                </span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p
                                  className={`text-xs ${tc.text} truncate`}
                                  style={{
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {m.name}
                                </p>
                                <p
                                  className="text-gray-400 truncate"
                                  style={{ fontSize: "9px" }}
                                >
                                  {m.position}
                                </p>
                              </div>
                            </div>
                          ))}

                          {assigned.length === 0 &&
                            !editMode && (
                              <div className="flex items-center justify-center h-10">
                                <span className="text-gray-300 text-xs">
                                  空缺
                                </span>
                              </div>
                            )}

                          {editMode &&
                            assigned.length < MAX_PER_SLOT && (
                              <div className="flex items-center justify-center py-1">
                                <div className="flex items-center gap-1 text-blue-400 text-xs">
                                  <Pencil className="w-3 h-3" />
                                  点击编辑
                                </div>
                              </div>
                            )}

                          {editMode &&
                            assigned.length >= MAX_PER_SLOT && (
                              <div className="flex items-center justify-center gap-1 py-0.5">
                                <Check className="w-3 h-3 text-gray-300" />
                                <span
                                  className="text-gray-300"
                                  style={{ fontSize: "10px" }}
                                >
                                  已满
                                </span>
                              </div>
                            )}

                          {isModified && !editMode && (
                            <div className="absolute top-1 right-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-orange-400"
                                title="已手动调整"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function exportCSV(result: ScheduleResult, week: WeekType) {
  const header = ["节次", ...DAYS].join(",");
  const rows = TIME_SLOTS.map((time) => {
    const cells = DAYS.map((day) => {
      if (isSlotDisabled(day, time)) return "不值班";
      const key = `${week}-${day}-${time}`;
      const assigned = result[key] ?? [];
      return assigned.length > 0
        ? assigned.map((m) => m.name).join("/")
        : "空缺";
    });
    return [time, ...cells].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `排班表_${week}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const {
    allMembers,
    importMembers,
    resetToDefault,
    isDefault,
  } = useMembers();

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("dashboard");
  const [scheduleResult, setScheduleResult] =
    useState<ScheduleResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeWeek, setActiveWeek] =
    useState<WeekType>("单周");

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [modifiedSlots, setModifiedSlots] = useState<
    Set<string>
  >(new Set());
  // Slot-centered modal (Layer 1)
  const [modalSlot, setModalSlot] = useState<{
    slotKey: string;
    week: WeekType;
    day: string;
    time: string;
  } | null>(null);
  // Person-centered modal (Layer 2, overlays slot modal)
  const [modalMember, setModalMember] = useState<Member | null>(
    null,
  );
  // Snapshot for discard
  const snapshotRef = useRef<ScheduleResult | null>(null);

  // Import state
  const [importPreview, setImportPreview] = useState<
    Member[] | null
  >(null);
  const [importError, setImportError] = useState<string | null>(
    null,
  );
  const [importMode, setImportMode] = useState<
    "replace" | "append"
  >("replace");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitted = allMembers.filter((m) => m.submitted);
  const unsubmitted = allMembers.filter((m) => !m.submitted);
  const total = allMembers.length;
  const submitRate =
    total > 0
      ? Math.round((submitted.length / total) * 100)
      : 0;

  const assignedCount = scheduleResult
    ? Object.values(scheduleResult).reduce(
        (s, arr) => s + arr.length,
        0,
      )
    : 0;

  const hasChanges = modifiedSlots.size > 0;

  // ── schedule generation ──
  const handleGenerate = async () => {
    setGenerating(true);
    setEditMode(false);
    setModifiedSlots(new Set());
    setModalSlot(null);
    setModalMember(null);
    await new Promise((r) => setTimeout(r, 1200));
    const result = generateSchedule(allMembers, MAX_PER_SLOT);
    setScheduleResult(result);
    snapshotRef.current = null;
    setGenerating(false);
    setActiveTab("schedule");
  };

  // ── edit mode actions ──
  const enterEditMode = () => {
    if (!scheduleResult) return;
    snapshotRef.current = JSON.parse(
      JSON.stringify(scheduleResult),
    );
    setEditMode(true);
  };

  const exitEditMode = (save: boolean) => {
    if (!save && snapshotRef.current) {
      setScheduleResult(snapshotRef.current);
      setModifiedSlots(new Set());
    }
    setEditMode(false);
    setModalSlot(null);
    setModalMember(null);
    snapshotRef.current = null;
  };

  // Apply person-centered changes
  const handlePersonApply = (
    memberId: string,
    addedSlots: string[],
    removedSlots: string[],
  ) => {
    if (!scheduleResult) return;
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return;

    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };

      // Remove from slots
      for (const slotKey of removedSlots) {
        if (next[slotKey]) {
          next[slotKey] = next[slotKey].filter(
            (m) => m.id !== memberId,
          );
          if (next[slotKey].length === 0) delete next[slotKey];
        }
      }

      // Add to slots
      for (const slotKey of addedSlots) {
        if (!next[slotKey]) next[slotKey] = [];
        if (!next[slotKey].some((m) => m.id === memberId)) {
          next[slotKey] = [...next[slotKey], member];
        }
      }

      return next;
    });

    setModifiedSlots((prev) => {
      const next = new Set(prev);
      for (const k of [...addedSlots, ...removedSlots]) {
        next.add(k);
      }
      return next;
    });
  };

  // Slot-level quick actions (from SlotEditModal)
  const handleRemoveMember = (
    slotKey: string,
    memberId: string,
  ) => {
    if (!scheduleResult) return;
    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next[slotKey] = (next[slotKey] ?? []).filter(
        (m) => m.id !== memberId,
      );
      if (next[slotKey].length === 0) delete next[slotKey];
      return next;
    });
    setModifiedSlots((prev) => new Set(prev).add(slotKey));
  };

  const handleAddMember = (slotKey: string, member: Member) => {
    if (!scheduleResult) return;
    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const current = next[slotKey] ?? [];
      if (current.length >= MAX_PER_SLOT) return prev;
      if (current.some((m) => m.id === member.id)) return prev;
      next[slotKey] = [...current, member];
      return next;
    });
    setModifiedSlots((prev) => new Set(prev).add(slotKey));
  };

  const handleCellClick = (
    slotKey: string,
    week: WeekType,
    day: string,
    time: string,
  ) => {
    setModalSlot({ slotKey, week, day, time });
  };

  const handleMemberClick = (member: Member) => {
    setModalMember(member);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // ── File import logic ──
  const COLUMN_ALIASES: Record<string, string[]> = {
    name: ["姓名", "name", "名字"],
    studentId: [
      "学号",
      "studentId",
      "student_id",
      "学生学号",
      "编号",
    ],
    department: ["部门", "department", "所属部门", "dept"],
    position: ["职位", "position", "职务", "角色", "role"],
  };

  function matchColumn(header: string): string | null {
    const h = header.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(
      COLUMN_ALIASES,
    )) {
      for (const alias of aliases) {
        if (h === alias.toLowerCase()) return field;
      }
    }
    return null;
  }

  function parseRowsToMembers(rows: Record<string, string>[]): {
    members: Member[];
    errors: string[];
  } {
    if (rows.length === 0)
      return { members: [], errors: ["文件中没有数据行"] };

    // Detect columns from first row keys
    const headers = Object.keys(rows[0]);
    const columnMap: Record<string, string> = {};
    for (const h of headers) {
      const field = matchColumn(h);
      if (field) columnMap[field] = h;
    }

    const missing = ["name", "studentId"].filter(
      (f) => !columnMap[f],
    );
    if (missing.length > 0) {
      return {
        members: [],
        errors: [
          `缺少必要列: ${missing.map((f) => (f === "name" ? "姓名" : "学号")).join("、")}。请确保表头包含"姓名"和"学号"列。`,
        ],
      };
    }

    const members: Member[] = [];
    const errors: string[] = [];
    const seenIds = new Set<string>();

    rows.forEach((row, idx) => {
      const name = (row[columnMap["name"]] ?? "").trim();
      const studentId = (
        row[columnMap["studentId"]] ?? ""
      ).trim();
      const department = columnMap["department"]
        ? (row[columnMap["department"]] ?? "").trim()
        : "";
      const position = columnMap["position"]
        ? (row[columnMap["position"]] ?? "").trim()
        : "干事";

      if (!name || !studentId) {
        if (name || studentId)
          errors.push(
            `第 ${idx + 2} 行: 姓名或学号为空，已跳过`,
          );
        return;
      }
      if (seenIds.has(studentId)) {
        errors.push(
          `第 ${idx + 2} 行: 学号 ${studentId} 重复，已跳过`,
        );
        return;
      }
      seenIds.add(studentId);

      members.push({
        id: `imported-${studentId}`,
        name,
        studentId,
        department: department || "未分配",
        position: position || "干事",
        submitted: false,
        shifts: [],
      });
    });

    return { members, errors };
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportPreview(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const { members, errors } = parseRowsToMembers(
            result.data as Record<string, string>[],
          );
          if (members.length === 0) {
            setImportError(
              errors[0] || "未能从文件中解析出有效数据",
            );
          } else {
            if (errors.length > 0)
              setImportError(errors.slice(0, 3).join("；"));
            setImportPreview(members);
          }
        },
        error: () => {
          setImportError("CSV 文件解析失败，请检查文件格式");
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<
            Record<string, string>
          >(sheet, { defval: "" });
          const { members, errors } = parseRowsToMembers(rows);
          if (members.length === 0) {
            setImportError(
              errors[0] || "未能从文件中解析出有效数据",
            );
          } else {
            if (errors.length > 0)
              setImportError(errors.slice(0, 3).join("；"));
            setImportPreview(members);
          }
        } catch {
          setImportError("Excel 文件解析失败，请检查文件格式");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setImportError(
        "不支持的文件格式，请上传 .csv 或 .xlsx/.xls 文件",
      );
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!importPreview || importPreview.length === 0) return;
    if (importMode === "replace") {
      importMembers(importPreview);
    } else {
      // append mode - merge with existing
      const existingIds = new Set(
        allMembers.map((m) => m.studentId),
      );
      const toAdd = importPreview.filter(
        (m) => !existingIds.has(m.studentId),
      );
      importMembers([...allMembers, ...toAdd]);
    }
    setImportPreview(null);
    setImportError(null);
    // Clear schedule since member list changed
    setScheduleResult(null);
    setModifiedSlots(new Set());
  };

  const cancelImport = () => {
    setImportPreview(null);
    setImportError(null);
  };

  const handleResetToDefault = () => {
    resetToDefault();
    setScheduleResult(null);
    setModifiedSlots(new Set());
    setImportPreview(null);
    setImportError(null);
  };

  // Close modal on Escape (Layer 2 first, then Layer 1)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalMember) {
          setModalMember(null);
        } else if (modalSlot) {
          setModalSlot(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalMember, modalSlot]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Nav ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p
                className="text-gray-800 text-sm"
                style={{ fontWeight: 700 }}
              >
                排班管理后台
              </p>
              <p className="text-gray-400 text-xs">
                Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{
                fontWeight:
                  activeTab === "dashboard" ? 600 : 400,
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              仪表盘
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                activeTab === "schedule"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{
                fontWeight:
                  activeTab === "schedule" ? 600 : 400,
              }}
            >
              <TableProperties className="w-3.5 h-3.5" />
              排班操作
              {scheduleResult && (
                <span
                  className="bg-green-500 text-white px-1.5 py-0.5 rounded-full"
                  style={{ fontSize: "10px" }}
                >
                  已生成
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* ── Import Member List ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3
                      className="text-gray-800"
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      导入成员名单
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">
                      上传 CSV / Excel
                      文件（需包含「姓名」「学号」列，可选「部门」「职位」列）
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isDefault && (
                    <button
                      onClick={handleResetToDefault}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
                      style={{ fontWeight: 500 }}
                      title="恢复为演示数据"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      恢复演示数据
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors shadow-sm shadow-indigo-200"
                    style={{ fontWeight: 600 }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    上传文件
                  </button>
                </div>
              </div>

              {/* Data source badge */}
              <div className="px-6 py-2.5 bg-gray-50/50 flex items-center gap-3 text-xs">
                <span className="text-gray-400">
                  当前数据源：
                </span>
                {isDefault ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
                    style={{ fontWeight: 500 }}
                  >
                    <Users className="w-3 h-3" />
                    内置演示数据 · {total} 人
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100"
                    style={{ fontWeight: 500 }}
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    已导入名单 · {total} 人
                  </span>
                )}
              </div>

              {/* Import error */}
              {importError && !importPreview && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p
                      className="text-red-600 text-xs"
                      style={{ fontWeight: 500 }}
                    >
                      {importError}
                    </p>
                    <p className="text-red-400 text-xs mt-1">
                      请确保文件表头包含「姓名」和「学号」列
                    </p>
                  </div>
                </div>
              )}

              {/* Import preview */}
              {importPreview && importPreview.length > 0 && (
                <div className="border-t border-gray-100">
                  {/* Preview header */}
                  <div className="px-6 py-3 bg-indigo-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      <span
                        className="text-indigo-700 text-xs"
                        style={{ fontWeight: 600 }}
                      >
                        已解析 {importPreview.length} 名成员
                      </span>
                      {importError && (
                        <span className="text-orange-500 text-xs ml-2">
                          (部分行有问题: {importError})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Import mode toggle */}
                      <div className="flex bg-white rounded-lg p-0.5 gap-0.5 border border-gray-200">
                        <button
                          onClick={() =>
                            setImportMode("replace")
                          }
                          className={`px-3 py-1 rounded-md text-xs transition-all ${
                            importMode === "replace"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          style={{
                            fontWeight:
                              importMode === "replace"
                                ? 600
                                : 400,
                          }}
                        >
                          替换全部
                        </button>
                        <button
                          onClick={() =>
                            setImportMode("append")
                          }
                          className={`px-3 py-1 rounded-md text-xs transition-all ${
                            importMode === "append"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          style={{
                            fontWeight:
                              importMode === "append"
                                ? 600
                                : 400,
                          }}
                        >
                          追加合并
                        </button>
                      </div>
                      <button
                        onClick={cancelImport}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmImport}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors shadow-sm"
                        style={{ fontWeight: 600 }}
                      >
                        确认导入
                      </button>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th
                            className="px-6 py-2 text-left text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            #
                          </th>
                          <th
                            className="px-4 py-2 text-left text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            姓名
                          </th>
                          <th
                            className="px-4 py-2 text-left text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            学号
                          </th>
                          <th
                            className="px-4 py-2 text-left text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            部门
                          </th>
                          <th
                            className="px-4 py-2 text-left text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            职位
                          </th>
                          <th
                            className="px-4 py-2 text-center text-gray-500"
                            style={{ fontWeight: 600 }}
                          >
                            状态
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview
                          .slice(0, 50)
                          .map((m, idx) => (
                            <tr
                              key={m.studentId}
                              className="border-b border-gray-50 hover:bg-gray-50/50"
                            >
                              <td className="px-6 py-2 text-gray-300">
                                {idx + 1}
                              </td>
                              <td
                                className="px-4 py-2 text-gray-700"
                                style={{ fontWeight: 500 }}
                              >
                                {m.name}
                              </td>
                              <td className="px-4 py-2 text-gray-500">
                                {m.studentId}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}
                                >
                                  {m.department}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full ${POSITION_COLORS[m.position] ?? "bg-gray-100 text-gray-500"}`}
                                >
                                  {m.position}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className="text-orange-400 flex items-center justify-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  未提交
                                </span>
                              </td>
                            </tr>
                          ))}
                        {importPreview.length > 50 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-3 text-center text-gray-400"
                            >
                              ... 还有{" "}
                              {importPreview.length - 50}{" "}
                              名成员未显示
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2
                className="text-gray-700 mb-4"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                概览统计
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={
                    <Users className="w-6 h-6 text-blue-600" />
                  }
                  label="总成员数"
                  value={total}
                  sub="全部参与人员"
                  color="bg-blue-50"
                />
                <StatCard
                  icon={
                    <UserCheck className="w-6 h-6 text-green-600" />
                  }
                  label="已提交"
                  value={submitted.length}
                  sub={`提交率 ${submitRate}%`}
                  color="bg-green-50"
                />
                <StatCard
                  icon={
                    <UserX className="w-6 h-6 text-orange-500" />
                  }
                  label="未提交"
                  value={unsubmitted.length}
                  sub="待催促人数"
                  color="bg-orange-50"
                />
                <StatCard
                  icon={
                    <Zap className="w-6 h-6 text-violet-600" />
                  }
                  label="排班状态"
                  value={scheduleResult ? "已完成" : "待生成"}
                  sub={
                    scheduleResult
                      ? `共分配 ${assignedCount} 人次`
                      : "点击一键排班"
                  }
                  color="bg-violet-50"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-gray-700 text-sm"
                  style={{ fontWeight: 600 }}
                >
                  提交进度
                </h3>
                <span
                  className="text-blue-600 text-sm"
                  style={{ fontWeight: 700 }}
                >
                  {submitRate}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                  style={{ width: `${submitRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-green-500 text-xs">
                  {submitted.length} 人已提交
                </span>
                <span className="text-orange-400 text-xs">
                  {unsubmitted.length} 人未提交
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UnsubmittedList members={unsubmitted} />
              <SubmittedList members={submitted} />
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-blue-100">
              <div>
                <h3
                  className="text-white mb-1"
                  style={{ fontSize: "15px", fontWeight: 700 }}
                >
                  准备好了吗？
                </h3>
                <p className="text-blue-200 text-sm">
                  {submitted.length}{" "}
                  名成员已提交志愿，可以开始自动排班
                </p>
              </div>
              <button
                onClick={() => setActiveTab("schedule")}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-blue-50 transition-colors shrink-0 ml-4"
                style={{ fontWeight: 600 }}
              >
                前往排班 →
              </button>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-5">
            <div>
              <h2
                className="text-gray-700"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                排班操作区
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                基于成员志愿优先级自动分配班次，支持手动微调
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3
                      className="text-gray-800 mb-1"
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                      }}
                    >
                      一键自动排班
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      系统将根据{" "}
                      <span
                        className="text-blue-500"
                        style={{ fontWeight: 600 }}
                      >
                        {submitted.length} 名
                      </span>{" "}
                      成员的志愿优先级，自动分配最优班次组合。每个时间段最多分配{" "}
                      {MAX_PER_SLOT} 人。
                    </p>
                    {scheduleResult && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span
                          className="text-green-600 text-xs"
                          style={{ fontWeight: 500 }}
                        >
                          排班已生成，共分配 {assignedCount}{" "}
                          人次
                          {hasChanges && !editMode && (
                            <span className="ml-2 text-orange-500">
                              · 含 {modifiedSlots.size}{" "}
                              处手动调整
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || editMode}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shrink-0 ${
                    generating || editMode
                      ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
                      : scheduleResult
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-gray-100"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                  }`}
                  style={{ fontWeight: 600 }}
                  title={editMode ? "请先退出编辑模式" : ""}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      排班中…
                    </>
                  ) : scheduleResult ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      重新排班
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      一键排班
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generating spinner */}
            {generating && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">
                  正在根据志愿优先级自动分配班次…
                </p>
              </div>
            )}

            {/* Schedule result area */}
            {scheduleResult && !generating && (
              <div>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className="text-gray-700"
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      排班结果
                    </h3>

                    {/* Week toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                      {(["单周", "双周"] as WeekType[]).map(
                        (w) => (
                          <button
                            key={w}
                            onClick={() => {
                              setActiveWeek(w);
                              setModalSlot(null);
                              setModalMember(null);
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                              activeWeek === w
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                            style={{
                              fontWeight:
                                activeWeek === w ? 600 : 400,
                            }}
                          >
                            {w}
                          </button>
                        ),
                      )}
                    </div>

                    {editMode && (
                      <div
                        className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1 rounded-full text-xs"
                        style={{ fontWeight: 600 }}
                      >
                        <Pencil className="w-3 h-3" />
                        编辑模式
                        {hasChanges && (
                          <span className="ml-1 bg-orange-200 text-orange-700 px-1.5 rounded-full">
                            {modifiedSlots.size} 处修改
                          </span>
                        )}
                      </div>
                    )}

                    {!editMode && hasChanges && (
                      <div className="flex items-center gap-1.5 text-orange-400 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        {modifiedSlots.size} 处已手动调整
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!editMode ? (
                      <button
                        onClick={enterEditMode}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 text-xs transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        手动微调
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => exitEditMode(false)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <X className="w-3.5 h-3.5" />
                          放弃修改
                        </button>
                        <button
                          onClick={() => exitEditMode(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs transition-colors shadow-sm"
                          style={{ fontWeight: 600 }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          保存调整
                        </button>
                      </>
                    )}

                    <div className="w-px h-5 bg-gray-200" />

                    <button
                      onClick={() => window.print()}
                      disabled={editMode}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ fontWeight: 500 }}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      打印
                    </button>
                    <button
                      onClick={() =>
                        exportCSV(scheduleResult, activeWeek)
                      }
                      disabled={editMode}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors shadow-sm shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ fontWeight: 600 }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      导出 CSV
                    </button>
                  </div>
                </div>

                {/* Edit mode help banner */}
                {editMode && (
                  <div className="mb-3 flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p
                        className="text-orange-700 text-xs"
                        style={{ fontWeight: 600 }}
                      >
                        当前处于手动微调模式（班次 +
                        人员双视角）
                      </p>
                      <p className="text-orange-500 text-xs mt-0.5">
                        点击任意单元格可打开班次编辑弹窗，在弹窗中可快速移除/添加人员（★
                        表示已填写该志愿）。点击弹窗中任意人员姓名，可进一步打开该人员的个人排班微调窗口，通过开关实现"取消A班次、加入B班次"的无缝换班。完成后点击「保存调整」确认，或「放弃修改」撤回所有变更。
                      </p>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {Object.entries(TIME_COLORS).map(
                    ([time, tc]) => (
                      <div
                        key={time}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${tc.bg}`}
                        />
                        <span className="text-gray-500 text-xs">
                          {time}
                        </span>
                      </div>
                    ),
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                    <span className="text-gray-400 text-xs">
                      空缺 / 不值班
                    </span>
                  </div>
                  {!editMode && hasChanges && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                      <span className="text-orange-400 text-xs">
                        已手动调整
                      </span>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <ScheduleTable
                    result={scheduleResult}
                    week={activeWeek}
                    editMode={editMode}
                    modifiedSlots={modifiedSlots}
                    onCellClick={handleCellClick}
                  />
                </div>

                {/* Coverage summary */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((time) => {
                    const tc = TIME_COLORS[time];
                    const filledSlots = DAYS.filter((day) => {
                      if (isSlotDisabled(day, time))
                        return false;
                      return (
                        (scheduleResult[
                          `${activeWeek}-${day}-${time}`
                        ]?.length ?? 0) > 0
                      );
                    }).length;
                    const totalSlots = DAYS.filter(
                      (day) => !isSlotDisabled(day, time),
                    ).length;
                    return (
                      <div
                        key={time}
                        className={`${tc.light} rounded-xl p-3 border ${tc.border}`}
                      >
                        <p
                          className={`text-xs ${tc.text} mb-1`}
                          style={{ fontWeight: 600 }}
                        >
                          {time}
                        </p>
                        <p
                          className="text-gray-800 text-sm"
                          style={{ fontWeight: 700 }}
                        >
                          {filledSlots} / {totalSlots}
                        </p>
                        <p
                          className="text-gray-400"
                          style={{ fontSize: "10px" }}
                        >
                          时间段已覆盖
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!scheduleResult && !generating && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <TableProperties className="w-8 h-8 text-gray-300" />
                </div>
                <p
                  className="text-gray-500 text-sm"
                  style={{ fontWeight: 500 }}
                >
                  排班表尚未生成
                </p>
                <p className="text-gray-400 text-xs max-w-xs">
                  点击上方「一键排班」按钮，系统将自动根据成员志愿生成排班表
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Layer 1: Slot Edit Modal (以班次为中心) */}
      {modalSlot && scheduleResult && (
        <SlotEditModal
          week={modalSlot.week}
          day={modalSlot.day}
          time={modalSlot.time}
          slotKey={modalSlot.slotKey}
          currentMembers={
            scheduleResult[modalSlot.slotKey] ?? []
          }
          scheduleResult={scheduleResult}
          onRemove={handleRemoveMember}
          onAdd={handleAddMember}
          onMemberClick={handleMemberClick}
          onClose={() => setModalSlot(null)}
        />
      )}

      {/* Layer 2: Personal Adjustment Modal (以人为中心, overlays slot modal) */}
      {modalMember && scheduleResult && (
        <PersonalAdjustmentModal
          member={modalMember}
          scheduleResult={scheduleResult}
          onApply={handlePersonApply}
          onClose={() => setModalMember(null)}
        />
      )}
    </div>
  );
}