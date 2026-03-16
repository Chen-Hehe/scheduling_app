import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useMembers } from "../../context/MemberContext";
import { Member } from "../../data/mockData";
import {
  apiGetRosterStatus,
  apiGetSchedule,
  apiImportRoster,
} from "../../api";
import {
  DEPT_COLORS,
  POSITION_COLORS,
} from "../../data/constants";
import {
  Users,
  UserCheck,
  UserX,
  Bell,
  Zap,
  LogOut,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Clock,
  LayoutGrid,
  TableProperties,
  AlertTriangle,
  Copy,
  Check,
  Upload,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>{value}</p>
        {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── UnsubmittedList ─────────────────────────────────────────────────────────

function UnsubmittedList({ members }: { members: Member[] }) {
  const [expanded, setExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const display = expanded ? members : members.slice(0, 5);

  const handleCopyNames = async () => {
    const names = members.map((m) => `@${m.department} ${m.name}`).join(" ");
    try {
      await navigator.clipboard.writeText(names);
      setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const ta = document.createElement("textarea"); ta.value = names;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          <h3 className="text-gray-700" style={{ fontSize: "14px", fontWeight: 600 }}>未提交提醒</h3>
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{members.length} 人</span>
        </div>
        <button onClick={handleCopyNames}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
            copySuccess ? "bg-green-50 text-green-600 border border-green-200" : "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
          }`} style={{ fontWeight: 500 }}>
          {copySuccess ? <><Check className="w-3 h-3" />复制成功</> : <><Copy className="w-3 h-3" />一键复制未交名单</>}
        </button>
      </div>
      <div className="space-y-2">
        {display.map((m) => (
          <div key={m.studentId} className="flex items-center justify-between px-3 py-2.5 bg-orange-50/60 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
                <span className="text-orange-700 text-xs" style={{ fontWeight: 700 }}>{m.name[0]}</span>
              </div>
              <div>
                <p className="text-gray-700 text-sm" style={{ fontWeight: 500 }}>{m.name}</p>
                <p className="text-gray-400 text-xs">{m.studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}>{m.department}</span>
              <span className="flex items-center gap-1 text-orange-400 text-xs"><Clock className="w-3 h-3" />待提交</span>
            </div>
          </div>
        ))}
      </div>
      {members.length > 5 && (
        <button onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "收起" : `展开全部 ${members.length} 人`}
        </button>
      )}
    </div>
  );
}

// ─── SubmittedList ────────────────────────────────────────────────────────────

function SubmittedList({ members }: { members: Member[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <h3 className="text-gray-700" style={{ fontSize: "14px", fontWeight: 600 }}>已提交名单</h3>
        <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{members.length} 人</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {members.map((m) => (
          <div key={m.studentId} className="flex items-center justify-between px-3 py-2.5 bg-green-50/60 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                <span className="text-green-700 text-xs" style={{ fontWeight: 700 }}>{m.name[0]}</span>
              </div>
              <div>
                <p className="text-gray-700 text-sm" style={{ fontWeight: 500 }}>{m.name}</p>
                <p className="text-gray-400 text-xs">{m.submitTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}>{m.department}</span>
              <span className="text-xs text-gray-400">{m.shifts.length} 志愿</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AdminDashboard Component ──────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { allMembers, importMembers, resetToDefault, isDefault } = useMembers();

  const [scheduleReady, setScheduleReady] = useState(false);
  const [importPreview, setImportPreview] = useState<Member[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [importingToBackend, setImportingToBackend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileForImportRef = useRef<File | null>(null);

  const submitted = allMembers.filter((m) => m.submitted);
  const unsubmitted = allMembers.filter((m) => !m.submitted);
  const total = allMembers.length;
  const submitRate = total > 0 ? Math.round((submitted.length / total) * 100) : 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roster, schedule] = await Promise.all([
          apiGetRosterStatus(),
          apiGetSchedule().catch(() => null),
        ]);
        if (cancelled) return;
        const merged = [...roster.submitted_members, ...roster.unsubmitted_members];
        if (merged.length > 0) importMembers(merged);
        if (schedule && Object.keys(schedule).length > 0) setScheduleReady(true);
      } catch (e) {
        if (!cancelled) console.warn("加载后端花名册/排班失败，使用本地数据", e);
      }
    })();
    return () => { cancelled = true; };
  }, [importMembers]);

  // ── File import helpers ──
  const COLUMN_ALIASES: Record<string, string[]> = {
    name: ["姓名", "name", "名字"],
    studentId: ["学号", "studentId", "student_id", "学生学号", "编号"],
    department: ["部门", "department", "所属部门", "dept"],
    position: ["职位", "position", "职务", "角色", "role"],
  };

  function normalizeHeader(h: string) { return h.replace(/^\uFEFF/, "").trim(); }

  function matchColumn(header: string): string | null {
    const h = normalizeHeader(header).toLowerCase();
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const alias of aliases) { if (h === alias.toLowerCase()) return field; }
    }
    return null;
  }

  function parseRowsToMembers(rows: Record<string, unknown>[]): { members: Member[]; errors: string[] } {
    if (rows.length === 0) return { members: [], errors: ["文件中没有数据行"] };
    const rawHeaders = Object.keys(rows[0]);
    const columnMap: Record<string, string> = {};
    for (const raw of rawHeaders) { const field = matchColumn(raw); if (field) columnMap[field] = raw; }
    const missing = ["name", "studentId"].filter((f) => !columnMap[f]);
    if (missing.length > 0) return { members: [], errors: [`缺少必要列: ${missing.map((f) => f === "name" ? "姓名" : "学号").join("、")}。请确保表头包含"姓名"和"学号"列。`] };
    const members: Member[] = [];
    const errors: string[] = [];
    const seenIds = new Set<string>();
    rows.forEach((row, idx) => {
      const name = String(row[columnMap["name"]] ?? "").trim();
      const studentId = String(row[columnMap["studentId"]] ?? "").trim();
      const department = String(row[columnMap["department"]] ?? "").trim();
      const position = String(row[columnMap["position"]] ?? "干事").trim() || "干事";
      if (!name || !studentId) { if (name || studentId) errors.push(`第 ${idx + 2} 行: 姓名或学号为空，已跳过`); return; }
      if (seenIds.has(studentId)) { errors.push(`第 ${idx + 2} 行: 学号 ${studentId} 重复，已跳过`); return; }
      seenIds.add(studentId);
      members.push({ studentId, name, department: department || "未分配", position, submitted: false, shifts: [] });
    });
    return { members, errors };
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportError(null); setImportPreview(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: (result) => {
        const { members, errors } = parseRowsToMembers(result.data as Record<string, string>[]);
        if (members.length === 0) { fileForImportRef.current = null; setImportError(errors[0] || "未能从文件中解析出有效数据"); }
        else { fileForImportRef.current = file; if (errors.length > 0) setImportError(errors.slice(0, 3).join("；")); setImportPreview(members); }
      }, error: () => { fileForImportRef.current = null; setImportError("CSV 文件解析失败，请检查文件格式"); } });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const workbook = XLSX.read(evt.target?.result, { type: "array" });
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
          const { members, errors } = parseRowsToMembers(rows);
          if (members.length === 0) { fileForImportRef.current = file; setImportPreview(null); setImportError(errors[0] || "未能从文件中解析出有效数据，可以尝试直接点击\"确认导入\"让后端解析。"); }
          else { fileForImportRef.current = file; if (errors.length > 0) setImportError(errors.slice(0, 3).join("；")); setImportPreview(members); }
        } catch (err) {
          console.error("Excel 预览解析失败", err);
          fileForImportRef.current = file; setImportPreview(null);
          setImportError("Excel 文件在前端预览失败，但可以尝试直接点击\"确认导入\"让后端解析。");
        }
      };
      reader.readAsArrayBuffer(file);
    } else { setImportError("不支持的文件格式，请上传 .csv 或 .xlsx/.xls 文件"); }
    e.target.value = "";
  };

  const confirmImport = async () => {
    const file = fileForImportRef.current;
    if (!file && (!importPreview || importPreview.length === 0)) return;
    if (file) {
      setImportingToBackend(true); setImportError(null);
      try {
        await apiImportRoster(file, importMode);
        const roster = await apiGetRosterStatus();
        importMembers([...roster.submitted_members, ...roster.unsubmitted_members]);
        setImportPreview(null); setImportError(null); setScheduleReady(false);
      } catch (e) { setImportError(e instanceof Error ? e.message : "导入失败，请稍后重试"); }
      finally { setImportingToBackend(false); fileForImportRef.current = null; }
      return;
    }
    if (importMode === "replace") { importMembers(importPreview ?? []); }
    else {
      const existingIds = new Set(allMembers.map((m) => m.studentId));
      importMembers([...allMembers, ...(importPreview ?? []).filter((m) => !existingIds.has(m.studentId))]);
    }
    setImportPreview(null); setImportError(null); setScheduleReady(false);
  };

  const cancelImport = () => { setImportPreview(null); setImportError(null); };

  const handleResetToDefault = () => {
    resetToDefault(); setScheduleReady(false); setImportPreview(null); setImportError(null);
  };

  const handleLogout = () => { logout(); navigate("/admin/login"); };

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
              <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>排班管理后台</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 bg-white text-blue-600 shadow-sm" style={{ fontWeight: 600 }}>
              <LayoutGrid className="w-3.5 h-3.5" />仪表盘
            </button>
            <button onClick={() => navigate("/admin/schedule")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-200 text-gray-500 hover:text-gray-700" style={{ fontWeight: 400 }}>
              <TableProperties className="w-3.5 h-3.5" />排班操作
              {scheduleReady && <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full" style={{ fontSize: "10px" }}>已生成</span>}
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-3.5 h-3.5" />退出登录
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-6">
        <div className="space-y-6">
          {/* ── Import Member List ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-gray-800" style={{ fontSize: "14px", fontWeight: 700 }}>导入成员名单</h3>
                  <p className="text-gray-400 text-xs mt-0.5">上传 CSV / Excel 文件（需包含「姓名」「学号」列，可选「部门」「职位」列）</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isDefault && (
                  <button onClick={handleResetToDefault} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors" style={{ fontWeight: 500 }} title="恢复为演示数据">
                    <RotateCcw className="w-3.5 h-3.5" />恢复演示数据
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors shadow-sm shadow-indigo-200" style={{ fontWeight: 600 }}>
                  <Upload className="w-3.5 h-3.5" />上传文件
                </button>
              </div>
            </div>
            <div className="px-6 py-2.5 bg-gray-50/50 flex items-center gap-3 text-xs">
              <span className="text-gray-400">当前数据源：</span>
              {isDefault ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100" style={{ fontWeight: 500 }}>
                  <Users className="w-3 h-3" />内置演示数据 · {total} 人
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100" style={{ fontWeight: 500 }}>
                  <FileSpreadsheet className="w-3 h-3" />已导入名单 · {total} 人
                </span>
              )}
            </div>
            {importError && !importPreview && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-600 text-xs" style={{ fontWeight: 500 }}>{importError}</p>
                  <p className="text-red-400 text-xs mt-1">请确保文件表头包含「姓名」和「学号」列</p>
                </div>
              </div>
            )}
            {importPreview && importPreview.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="px-6 py-3 bg-indigo-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-700 text-xs" style={{ fontWeight: 600 }}>已解析 {importPreview.length} 名成员</span>
                    {importError && <span className="text-orange-500 text-xs ml-2">(部分行有问题: {importError})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white rounded-lg p-0.5 gap-0.5 border border-gray-200">
                      <button onClick={() => setImportMode("replace")} className={`px-3 py-1 rounded-md text-xs transition-all ${importMode === "replace" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`} style={{ fontWeight: importMode === "replace" ? 600 : 400 }}>替换全部</button>
                      <button onClick={() => setImportMode("append")} className={`px-3 py-1 rounded-md text-xs transition-all ${importMode === "append" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`} style={{ fontWeight: importMode === "append" ? 600 : 400 }}>追加合并</button>
                    </div>
                    <button onClick={cancelImport} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors" style={{ fontWeight: 500 }}>取消</button>
                    <button onClick={confirmImport} disabled={importingToBackend} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors shadow-sm disabled:opacity-50" style={{ fontWeight: 600 }}>{importingToBackend ? "导入中…" : "确认导入"}</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-2 text-left text-gray-500" style={{ fontWeight: 600 }}>#</th>
                        <th className="px-4 py-2 text-left text-gray-500" style={{ fontWeight: 600 }}>姓名</th>
                        <th className="px-4 py-2 text-left text-gray-500" style={{ fontWeight: 600 }}>学号</th>
                        <th className="px-4 py-2 text-left text-gray-500" style={{ fontWeight: 600 }}>部门</th>
                        <th className="px-4 py-2 text-left text-gray-500" style={{ fontWeight: 600 }}>职位</th>
                        <th className="px-4 py-2 text-center text-gray-500" style={{ fontWeight: 600 }}>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 50).map((m, idx) => (
                        <tr key={m.studentId} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-6 py-2 text-gray-300">{idx + 1}</td>
                          <td className="px-4 py-2 text-gray-700" style={{ fontWeight: 500 }}>{m.name}</td>
                          <td className="px-4 py-2 text-gray-500">{m.studentId}</td>
                          <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-full ${DEPT_COLORS[m.department] ?? "bg-gray-100 text-gray-500"}`}>{m.department}</span></td>
                          <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-full ${POSITION_COLORS[m.position] ?? "bg-gray-100 text-gray-500"}`}>{m.position}</span></td>
                          <td className="px-4 py-2 text-center"><span className="text-orange-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />未提交</span></td>
                        </tr>
                      ))}
                      {importPreview.length > 50 && (
                        <tr><td colSpan={6} className="px-6 py-3 text-center text-gray-400">... 还有 {importPreview.length - 50} 名成员未显示</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Stats ── */}
          <div>
            <h2 className="text-gray-700 mb-4" style={{ fontSize: "15px", fontWeight: 600 }}>概览统计</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="总成员数" value={total} sub="全部参与人员" color="bg-blue-50" />
              <StatCard icon={<UserCheck className="w-6 h-6 text-green-600" />} label="已提交" value={submitted.length} sub={`提交率 ${submitRate}%`} color="bg-green-50" />
              <StatCard icon={<UserX className="w-6 h-6 text-orange-500" />} label="未提交" value={unsubmitted.length} sub="待催促人数" color="bg-orange-50" />
              <StatCard icon={<Zap className="w-6 h-6 text-violet-600" />} label="排班状态" value={scheduleReady ? "已完成" : "待生成"} sub={scheduleReady ? "点击前往排班页查看" : "点击一键排班"} color="bg-violet-50" />
            </div>
          </div>

          {/* ── Progress ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>提交进度</h3>
              <span className="text-blue-600 text-sm" style={{ fontWeight: 700 }}>{submitRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700" style={{ width: `${submitRate}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-green-500 text-xs">{submitted.length} 人已提交</span>
              <span className="text-orange-400 text-xs">{unsubmitted.length} 人未提交</span>
            </div>
          </div>

          {/* ── Lists ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UnsubmittedList members={unsubmitted} />
            <SubmittedList members={submitted} />
          </div>

          {/* ── CTA ── */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-blue-100">
            <div>
              <h3 className="text-white mb-1" style={{ fontSize: "15px", fontWeight: 700 }}>准备好了吗？</h3>
              <p className="text-blue-200 text-sm">{submitted.length} 名成员已提交志愿，可以开始自动排班</p>
            </div>
            <button onClick={() => navigate("/admin/schedule")} className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-blue-50 transition-colors shrink-0 ml-4" style={{ fontWeight: 600 }}>
              前往排班 →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
