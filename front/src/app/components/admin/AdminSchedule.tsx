import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useMembers } from "../../context/MemberContext";
import { DAYS, TIME_SLOTS, ScheduleResult, Member } from "../../data/mockData";
import {
  TIME_COLORS,
  POSITION_COLORS,
  ROLE_MAX_COUNT,
  MAX_PER_SLOT,
  isSlotDisabled,
  timeRange,
  memberPrefersSlot,
  WeekType,
} from "../../data/constants";
import {
  apiGenerateSchedule,
  apiGetSchedule,
  apiGetPersonalAdjustment,
  apiUpdatePersonalAdjustment,
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
                          {assigned.map((m) => (
                            <div key={`${slotKey}-${m.studentId}`} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${tc.light} border ${tc.border}`}>
                              <div className={`w-5 h-5 rounded-full ${tc.bg} flex items-center justify-center shrink-0`}>
                                <span className="text-white" style={{ fontSize: "9px", fontWeight: 700 }}>{m.name[0]}</span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-xs ${tc.text} truncate`} style={{ fontWeight: 600, lineHeight: 1.2 }}>{m.name}</p>
                                <p className="text-gray-400 truncate" style={{ fontSize: "9px" }}>{m.position}</p>
                              </div>
                            </div>
                          ))}
                          {assigned.length === 0 && !editMode && (
                            <div className="flex items-center justify-center h-10"><span className="text-gray-300 text-xs">空缺</span></div>
                          )}
                          {editMode && assigned.length < MAX_PER_SLOT && (
                            <div className="flex items-center justify-center py-1">
                              <div className="flex items-center gap-1 text-blue-400 text-xs"><Pencil className="w-3 h-3" />点击编辑</div>
                            </div>
                          )}
                          {editMode && assigned.length >= MAX_PER_SLOT && (
                            <div className="flex items-center justify-center gap-1 py-0.5">
                              <Check className="w-3 h-3 text-gray-300" />
                              <span className="text-gray-300" style={{ fontSize: "10px" }}>已满</span>
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
  const [modifiedSlots, setModifiedSlots] = useState<Set<string>>(new Set());

  const assignedCount = scheduleResult ? Object.values(scheduleResult).reduce((s, arr) => s + arr.length, 0) : 0;
  const hasChanges = modifiedSlots.size > 0;

  useEffect(() => {
    apiGetSchedule().then((r) => { if (r && Object.keys(r).length > 0) setScheduleResult(r); }).catch(() => {});
  }, []);

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
                    系统将根据 <span className="text-blue-500" style={{ fontWeight: 600 }}>{submitted.length} 名</span> 成员的志愿优先级，自动分配最优班次组合。每个时间段最多分配 {MAX_PER_SLOT} 人。
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
          {generating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center"><RefreshCw className="w-7 h-7 text-blue-500 animate-spin" /></div>
              <p className="text-gray-500 text-sm">正在根据志愿优先级自动分配班次…</p>
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
    </div>
  );
}
