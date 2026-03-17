import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useMembers } from "../../context/MemberContext";
import { DAYS, TIME_SLOTS, ScheduleResult, Member } from "../../data/mockData";
import {
  TIME_COLORS,
  POSITION_COLORS,
  ROLE_MAX_COUNT,
  isSlotDisabled,
  timeRange,
  memberPrefersSlot,
  WeekType,
} from "../../data/constants";
import { SlotEditModal } from "./SlotEditModal";
import { PersonalAdjustmentModal } from "./PersonalAdjustmentModal";
import {
  apiGenerateSchedule,
  apiGetSchedule,
  apiGetPersonalAdjustment,
  apiUpdatePersonalAdjustment,
  apiGetGlobalMinRequired,
  apiUpdateGlobalMinRequired,
  PersonalAdjustmentData,
} from "../../api";
import {
  ShieldCheck,
  LogOut,
  LayoutGrid,
  TableProperties,
  RefreshCw,
  Zap,
  Download,
  Printer,
  Pencil,
  X,
  Check,
  AlertTriangle,
  Search,
  ToggleLeft,
  ToggleRight,
  User,
  Plus,
  ChevronRight,
  CheckCircle2,
  Crown,
  Info,
} from "lucide-react";


// ─── Schedule Table ──────────────────────────────────────────────────────────

function ScheduleTable({
  result, week, editMode, modifiedSlots, onCellClick,
}: {
  result: ScheduleResult; week: WeekType; editMode: boolean;
  modifiedSlots: Set<string>;
  onCellClick: (slotKey: string, week: WeekType, day: string, time: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth: "640px" }}>
        <thead>
          <tr>
            <th className="bg-gray-50 border border-gray-200 px-3 py-3 text-left text-gray-500 text-xs w-28" style={{ fontWeight: 600 }}>节次 / 星期</th>
            {DAYS.map((day) => (
              <th key={day} className={`border border-gray-200 px-3 py-3 text-center text-xs ${day === "周六" ? "bg-red-50 text-red-400" : "bg-gray-50 text-gray-500"}`} style={{ fontWeight: 600 }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((time) => {
            const tc = TIME_COLORS[time];
            return (
              <tr key={time}>
                <td className={`border border-gray-200 px-3 py-3 ${tc.light}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${tc.bg}`} />
                    <div>
                      <p className={`text-xs ${tc.text}`} style={{ fontWeight: 700 }}>{time}</p>
                      <p className="text-gray-400" style={{ fontSize: "10px" }}>{timeRange(time)}</p>
                    </div>
                  </div>
                </td>
                {DAYS.map((day) => {
                  const disabled = isSlotDisabled(day, time);
                  const slotKey = `${week}-${day}-${time}`;
                  const assigned: Member[] = result[slotKey] ?? [];
                  const isModified = modifiedSlots.has(slotKey);
                  return (
                    <td
                      key={day}
                      className={`border border-gray-200 px-2 py-2 align-top transition-colors relative ${
                        disabled ? "bg-gray-50"
                        : editMode ? `${assigned.length > 0 ? tc.light : "bg-white"} cursor-pointer hover:ring-2 hover:ring-inset hover:${tc.ring} ${isModified ? `ring-2 ring-inset ${tc.ring}` : ""}`
                        : isModified ? `${tc.light} ring-2 ring-inset ${tc.ring}`
                        : assigned.length > 0 ? tc.light : "bg-white"
                      }`}
                      style={{ minHeight: "64px", minWidth: "90px" }}
                      onClick={() => { if (editMode && !disabled) onCellClick(slotKey, week, day, time); }}
                    >
                      {disabled ? (
                        <div className="flex items-center justify-center h-10"><span className="text-gray-200 text-xs">—</span></div>
                      ) : (
                        <div className="space-y-1">
                          {/* Gap badges */}
                          {assigned.length > 0 && !assigned.some((m) => m.is_leader) && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 border border-red-200 text-red-600" style={{ fontSize: "9px", fontWeight: 700 }}>
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />缺组长
                            </div>
                          )}
                          {assigned.length > 0 && time !== "第三四节" && assigned.every((m) => m.position === "副部长" || m.position === "部长" || m.position === "主席" || m.position === "副主席") && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-500" style={{ fontSize: "9px", fontWeight: 600 }}>
                              <Info className="w-2.5 h-2.5 shrink-0" />建议补充干事
                            </div>
                          )}
                          {[...assigned].sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0)).map((m) => (
                            <div key={`${slotKey}-${m.studentId}`} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${m.is_leader ? "bg-amber-50 border border-amber-300" : `${tc.light} border ${tc.border}`}`}>
                              <div className={`w-5 h-5 rounded-full ${m.is_leader ? "bg-amber-400" : tc.bg} flex items-center justify-center shrink-0`}>
                                <span className="text-white" style={{ fontSize: "9px", fontWeight: 700 }}>{m.name[0]}</span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-0.5">
                                  {m.is_leader && <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                                  <p className={`text-xs ${m.is_leader ? "text-amber-700" : tc.text} truncate`} style={{ fontWeight: 600, lineHeight: 1.2 }}>{m.name}</p>
                                </div>
                                <p className="text-gray-400 truncate" style={{ fontSize: "9px" }}>{m.position}</p>
                              </div>
                            </div>
                          ))}
                          {assigned.length === 0 && !editMode && (
                            <div className="flex flex-col items-center justify-center h-10 gap-0.5">
                              <span className="text-gray-300 text-xs">空缺</span>
                              <div className="flex items-center gap-0.5 text-red-300" style={{ fontSize: "9px" }}>
                                <AlertTriangle className="w-2.5 h-2.5" />缺组长
                              </div>
                            </div>
                          )}
                          {editMode && (
                            <div className="flex items-center justify-center py-1">
                              <div className="flex items-center gap-1 text-blue-400 text-xs"><Pencil className="w-3 h-3" />点击编辑</div>
                            </div>
                          )}
                          {isModified && !editMode && (
                            <div className="absolute top-1 right-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" title="已手动调整" /></div>
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

// ─── exportCSV ────────────────────────────────────────────────────────────────

function exportCSV(result: ScheduleResult, week: WeekType) {
  const header = ["节次", ...DAYS].join(",");
  const rows = TIME_SLOTS.map((time) => {
    const cells = DAYS.map((day) => {
      if (isSlotDisabled(day, time)) return "不值班";
      const key = `${week}-${day}-${time}`;
      const assigned = result[key] ?? [];
      return assigned.length > 0 ? assigned.map((m) => m.name).join("/") : "空缺";
    });
    return [time, ...cells].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `排班表_${week}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminSchedule() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { allMembers } = useMembers();
  const submitted = allMembers.filter((m) => m.submitted);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeWeek, setActiveWeek] = useState<WeekType>("单周");
  const [editMode, setEditMode] = useState(false);
  const [modifiedSlots, setModifiedSlots] = useState<Set<string>>(new Set());
  const [modalSlot, setModalSlot] = useState<{ slotKey: string; week: WeekType; day: string; time: string } | null>(null);
  const [modalMember, setModalMember] = useState<Member | null>(null);
  const [globalMinReq, setGlobalMinReq] = useState<number>(1);
  const [savingMinReq, setSavingMinReq] = useState(false);
  const snapshotRef = useRef<ScheduleResult | null>(null);

  const assignedCount = scheduleResult ? Object.values(scheduleResult).reduce((s, arr) => s + arr.length, 0) : 0;
  const hasChanges = modifiedSlots.size > 0;

  useEffect(() => {
    apiGetSchedule().then((r) => { if (r && Object.keys(r).length > 0) setScheduleResult(r); }).catch(() => {});
    apiGetGlobalMinRequired().then((r) => setGlobalMinReq(r.min_required)).catch(() => {});
  }, []);

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

  const handleSaveMinReq = async () => {
    setSavingMinReq(true);
    try {
      await apiUpdateGlobalMinRequired({ min_required: globalMinReq });
      // Simple inline toast via a temporary DOM alert alternative
      const toast = document.createElement("div");
      toast.textContent = "✓ 全局班次最少人数已保存";
      toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:fadeIn .2s ease";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } catch (e) {
      alert("保存失败：" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSavingMinReq(false);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    if (submitted.length === 0) {
      alert("没有已提交志愿的成员，无法生成排班");
      return;
    }
    setGenerating(true);
    setModifiedSlots(new Set());
    try {
      console.log("开始生成排班...");
      const genRes = await apiGenerateSchedule();
      console.log("排班生成响应:", genRes);
      
      console.log("获取排班结果...");
      const result = await apiGetSchedule();
      console.log("排班结果:", result);
      
      if (result && Object.keys(result).length > 0) {
        setScheduleResult(result);
        console.log("排班成功，共", Object.values(result).reduce((s, arr) => s + arr.length, 0), "人次");
      } else {
        console.warn("排班结果为空");
        alert("排班生成成功，但结果为空。请检查后端数据");
      }
    } catch (e) {
      console.error("排班生成失败:", e);
      alert("生成排班失败：" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  const enterEditMode = () => {
    if (!scheduleResult) return;
    snapshotRef.current = JSON.parse(JSON.stringify(scheduleResult));
    setEditMode(true);
  };

  const exitEditMode = async (save: boolean) => {
    if (!save) {
      if (snapshotRef.current) {
        setScheduleResult(snapshotRef.current);
        setModifiedSlots(new Set());
      }
      setEditMode(false);
      setModalSlot(null);
      setModalMember(null);
      snapshotRef.current = null;
      return;
    }
    // 保存修改到后端
    if (!scheduleResult || !snapshotRef.current) {
      setEditMode(false);
      setModalSlot(null);
      setModalMember(null);
      snapshotRef.current = null;
      return;
    }
    const before = snapshotRef.current;
    const after = scheduleResult;
    const getStudentId = (m: any): string | null => m?.studentId ?? m?.student_id ?? null;
    const collectByStudent = (result: ScheduleResult) => {
      const map = new Map<string, Set<string>>();
      Object.entries(result).forEach(([slotKey, members]) => {
        (members as any[]).forEach((m) => {
          const sid = getStudentId(m);
          if (!sid) return;
          if (!map.has(sid)) map.set(sid, new Set());
          map.get(sid)!.add(slotKey);
        });
      });
      return map;
    };
    const beforeMap = collectByStudent(before);
    const afterMap = collectByStudent(after);
    const allIds = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);
    const changed: string[] = [];
    for (const sid of allIds) {
      const bs = beforeMap.get(sid) ?? new Set<string>();
      const as_ = afterMap.get(sid) ?? new Set<string>();
      if (bs.size !== as_.size) {
        changed.push(sid);
        continue;
      }
      let diff = false;
      for (const k of bs) {
        if (!as_.has(k)) {
          diff = true;
          break;
        }
      }
      if (!diff) {
        for (const k of as_) {
          if (!bs.has(k)) {
            diff = true;
            break;
          }
        }
      }
      if (diff) changed.push(sid);
    }
    try {
      // Build leader_shift_ids: for each changed student, find slots where they are is_leader in `after`
      const leaderSlotsByStudent = new Map<string, string[]>();
      Object.entries(after).forEach(([slotKey, members]) => {
        (members as any[]).forEach((m) => {
          const sid = m?.studentId ?? m?.student_id;
          if (sid && m.is_leader) {
            if (!leaderSlotsByStudent.has(sid)) leaderSlotsByStudent.set(sid, []);
            leaderSlotsByStudent.get(sid)!.push(slotKey);
          }
        });
      });
      await Promise.all(
        changed.map((sid) =>
          apiUpdatePersonalAdjustment(sid, {
            assigned_shift_ids: Array.from(afterMap.get(sid) ?? new Set<string>()),
            leader_shift_ids: leaderSlotsByStudent.get(sid) ?? [],
          })
        )
      );
      const refreshed = await apiGetSchedule();
      setScheduleResult(refreshed);
      setModifiedSlots(new Set());
      setEditMode(false);
      setModalSlot(null);
      setModalMember(null);
      snapshotRef.current = null;
    } catch (e) {
      console.error(e);
      alert("保存调整到后端失败，请稍后重试。");
    }
  };

  const handleRemoveMember = (slotKey: string, memberId: string) => {
    if (!scheduleResult) return;
    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next[slotKey] = (next[slotKey] ?? []).filter((m) => m.studentId !== memberId);
      if (next[slotKey].length === 0) delete next[slotKey];
      return next;
    });
    setModifiedSlots((prev) => new Set(prev).add(slotKey));
  };

  const handleSetLeader = (slotKey: string, memberId: string) => {
    if (!scheduleResult) return;
    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next[slotKey] = (next[slotKey] ?? []).map((m) => ({
        ...m,
        is_leader: m.studentId === memberId,
      }));
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
      if (current.some((m) => m.studentId === member.studentId)) return prev;
      next[slotKey] = [...current, member];
      return next;
    });
    setModifiedSlots((prev) => new Set(prev).add(slotKey));
  };

  const handleMemberClick = (member: Member) => {
    setModalMember(member);
  };

  const handlePersonApply = (memberId: string, addedSlots: string[], removedSlots: string[]) => {
    if (!scheduleResult) return;
    const member = allMembers.find((m) => m.studentId === memberId);
    if (!member) return;

    setScheduleResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev };

      for (const slotKey of removedSlots) {
        if (next[slotKey]) {
          next[slotKey] = next[slotKey].filter((m) => m.studentId !== memberId);
          if (next[slotKey].length === 0) delete next[slotKey];
        }
      }

      for (const slotKey of addedSlots) {
        if (!next[slotKey]) next[slotKey] = [];
        if (!next[slotKey].some((m) => m.studentId === memberId)) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>排班管理后台</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 text-gray-500 hover:text-gray-700" style={{ fontWeight: 400 }}>
              <LayoutGrid className="w-3.5 h-3.5" />仪表盘
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 bg-white text-blue-600 shadow-sm" style={{ fontWeight: 600 }}>
              <TableProperties className="w-3.5 h-3.5" />排班操作
              {scheduleResult && (
                <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full" style={{ fontSize: "10px" }}>已生成</span>
              )}
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-3.5 h-3.5" />退出登录
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-gray-700" style={{ fontSize: "15px", fontWeight: 600 }}>排班操作区</h2>
            <p className="text-gray-400 text-xs mt-0.5">基于成员志愿优先级自动分配班次，支持手动微调</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0"><Zap className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <h3 className="text-gray-800 mb-1" style={{ fontSize: "15px", fontWeight: 700 }}>一键自动排班</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    系统将根据 <span className="text-blue-500" style={{ fontWeight: 600 }}>{submitted.length} 名</span> 成员的志愿优先级，自动分配最优班次组合。
                  </p>
                  {scheduleResult && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600 text-xs" style={{ fontWeight: 500 }}>
                        排班已生成，共分配 {assignedCount} 人次
                        {hasChanges && (
                          <span className="ml-2 text-orange-500">· 含 {modifiedSlots.size} 处手动调整</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap" style={{ fontWeight: 500 }}>每班最少人数</span>
                  <input
                    type="number"
                    min={1}
                    value={globalMinReq}
                    onChange={(e) => setGlobalMinReq(Math.max(1, Number(e.target.value)))}
                    className="w-14 text-center text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white transition-all"
                    style={{ fontWeight: 600 }}
                  />
                  <button
                    onClick={handleSaveMinReq}
                    disabled={savingMinReq}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500 }}
                  >
                    {savingMinReq ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-green-500" />}
                    保存
                  </button>
                </div>
                <button onClick={handleGenerate} disabled={generating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shrink-0 ${
                    generating ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
                    : scheduleResult ? "bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-gray-100"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                  }`} style={{ fontWeight: 600 }}>
                  {generating ? <><RefreshCw className="w-4 h-4 animate-spin" />排班中…</>
                    : scheduleResult ? <><RefreshCw className="w-4 h-4" />重新排班</>
                    : <><Zap className="w-4 h-4" />一键排班</>}
                </button>
              </div>
            </div>
          </div>
          {generating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center"><RefreshCw className="w-7 h-7 text-blue-500 animate-spin" /></div>
              <p className="text-gray-500 text-sm">正在根据志愿优先级自动分配班次…</p>
            </div>
          )}

          {scheduleResult && !generating && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-gray-700" style={{ fontSize: "14px", fontWeight: 600 }}>排班结果</h3>
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {(["单周", "双周"] as WeekType[]).map((w) => (
                      <button key={w} onClick={() => { setActiveWeek(w); setModalSlot(null); }}
                        className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeWeek === w ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        style={{ fontWeight: activeWeek === w ? 600 : 400 }}>{w}</button>
                    ))}
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1 rounded-full text-xs" style={{ fontWeight: 600 }}>
                      <Pencil className="w-3 h-3" />编辑模式
                      {modifiedSlots.size > 0 && <span className="ml-1 bg-orange-200 text-orange-700 px-1.5 rounded-full">{modifiedSlots.size} 处修改</span>}
                    </div>
                  )}
                  {!editMode && modifiedSlots.size > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />{modifiedSlots.size} 处已手动调整
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editMode ? (
                    <button onClick={enterEditMode} disabled={!scheduleResult} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}>
                      <Pencil className="w-3.5 h-3.5" />手动微调
                    </button>
                  ) : (
                    <>
                      <button onClick={() => exitEditMode(false)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors" style={{ fontWeight: 500 }}>
                        <X className="w-3.5 h-3.5" />放弃修改
                      </button>
                      <button onClick={() => exitEditMode(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs transition-colors shadow-sm" style={{ fontWeight: 600 }}>
                        <Check className="w-3.5 h-3.5" />保存调整
                      </button>
                    </>
                  )}
                  <div className="w-px h-5 bg-gray-200" />
                  <button onClick={() => window.print()} disabled={editMode} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontWeight: 500 }}>
                    <Printer className="w-3.5 h-3.5" />打印
                  </button>
                  <button onClick={() => exportCSV(scheduleResult, activeWeek)} disabled={editMode} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors shadow-sm shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}>
                    <Download className="w-3.5 h-3.5" />导出 CSV
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap mb-3">
                {Object.entries(TIME_COLORS).map(([time, tc]) => (
                  <div key={time} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${tc.bg}`} />
                    <span className="text-gray-500 text-xs">{time}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /><span className="text-gray-400 text-xs">空缺 / 不值班</span></div>
                {!editMode && modifiedSlots.size > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" /><span className="text-orange-400 text-xs">已手动调整</span></div>}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <ScheduleTable result={scheduleResult} week={activeWeek} editMode={editMode} modifiedSlots={modifiedSlots}
                  onCellClick={(sk, w, d, t) => { if (editMode) setModalSlot({ slotKey: sk, week: w, day: d, time: t }); }} />
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIME_SLOTS.map((time) => {
                  const tc = TIME_COLORS[time];
                  const filledSlots = DAYS.filter((day) => !isSlotDisabled(day, time) && (scheduleResult[`${activeWeek}-${day}-${time}`]?.length ?? 0) > 0).length;
                  const totalSlots = DAYS.filter((day) => !isSlotDisabled(day, time)).length;
                  return (
                    <div key={time} className={`${tc.light} rounded-xl p-3 border ${tc.border}`}>
                      <p className={`text-xs ${tc.text} mb-1`} style={{ fontWeight: 600 }}>{time}</p>
                      <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>{filledSlots} / {totalSlots}</p>
                      <p className="text-gray-400" style={{ fontSize: "10px" }}>时间段已覆盖</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!scheduleResult && !generating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center"><TableProperties className="w-8 h-8 text-gray-300" /></div>
              <p className="text-gray-500 text-sm" style={{ fontWeight: 500 }}>排班表尚未生成</p>
              <p className="text-gray-400 text-xs max-w-xs">点击上方「一键排班」按钮，系统将自动根据成员志愿生成排班表</p>
            </div>
          )}
        </div>
      </main>

      {/* Layer 1: Slot Edit Modal */}
      {modalSlot && scheduleResult && (
        <SlotEditModal
          week={modalSlot.week}
          day={modalSlot.day}
          time={modalSlot.time}
          slotKey={modalSlot.slotKey}
          currentMembers={scheduleResult[modalSlot.slotKey] ?? []}
          onRemove={handleRemoveMember}
          onAdd={handleAddMember}
          onSetLeader={handleSetLeader}
          onMemberClick={handleMemberClick}
          onClose={() => setModalSlot(null)}
        />
      )}

      {/* Layer 2: Personal Adjustment Modal */}
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
