import * as React from "react";
import { useState } from "react";
import { useMembers } from "../../context/MemberContext";
import { Member } from "../../data/mockData";
import {
  TIME_COLORS,
  POSITION_COLORS,
  timeRange,
  memberPrefersSlot,
  WeekType,
} from "../../data/constants";
import {
  X,
  Search,
  Plus,
  ChevronRight,
  Crown,
} from "lucide-react";

export function SlotEditModal({
  week,
  day,
  time,
  slotKey,
  currentMembers,
  onRemove,
  onAdd,
  onSetLeader,
  onMemberClick,
  onClose,
}: {
  week: WeekType;
  day: string;
  time: string;
  slotKey: string;
  currentMembers: Member[];
  onRemove: (slotKey: string, memberId: string) => void;
  onAdd: (slotKey: string, member: Member) => void;
  onSetLeader: (slotKey: string, memberId: string) => void;
  onMemberClick: (member: Member) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const tc = TIME_COLORS[time];
  const { allMembers } = useMembers();

  const submitted = allMembers.filter((m) => m.submitted);
  const currentIds = new Set(currentMembers.map((m) => m.studentId));
  const available = submitted.filter(
    (m) => !currentIds.has(m.studentId),
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
                {timeRange(time)} · 已安排 {currentMembers.length} 人
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
                  const memberForPref =
                    allMembers.find((am) => am.studentId === m.studentId) ?? m;
                  const prefers = memberPrefersSlot(
                    memberForPref,
                    week,
                    day,
                    time,
                  );
                  return (
                    <div
                      key={m.studentId}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all group ${
                        prefers
                          ? "bg-amber-50/50 border-amber-100"
                          : "bg-gray-50 border-gray-100"
                      }`}
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
                            {m.is_leader && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="组长" />
                            )}
                            <span
                              className={`text-sm underline decoration-dotted underline-offset-2 ${
                                m.is_leader ? "text-amber-700" : "text-gray-700"
                              }`}
                              style={{ fontWeight: m.is_leader ? 700 : 500 }}
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
                          <p className="text-gray-400 text-xs truncate">
                            {m.department} · {m.studentId}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      </button>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {!m.is_leader && (m.position === "副部长" || m.position === "部长" || m.position === "主席" || m.position === "副主席") && (
                          <button
                            onClick={() => onSetLeader(slotKey, m.studentId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 text-xs transition-colors"
                            style={{ fontWeight: 500 }}
                            title="设为本班次组长"
                          >
                            <Crown className="w-3 h-3" />
                            设为组长
                          </button>
                        )}
                        {m.is_leader && (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs" style={{ fontWeight: 600 }}>
                            <Crown className="w-3 h-3" />
                            组长
                          </span>
                        )}
                        <button
                          onClick={() => onRemove(slotKey, m.studentId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <X className="w-3 h-3" />
                          移除
                        </button>
                      </div>
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
                      key={m.studentId}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                        prefers
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
                      <button
                        onClick={() => onAdd(slotKey, m)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 text-xs transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <Plus className="w-3 h-3" />
                        添加
                      </button>
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
