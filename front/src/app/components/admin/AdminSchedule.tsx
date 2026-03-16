import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useMembers } from "../../context/MemberContext";
import { ScheduleResult, Member } from "../../data/mockData";
import {
  MAX_PER_SLOT,
} from "../../data/constants";
import {
  apiGenerateSchedule,
  apiGetSchedule,
} from "../../api";
import {
  ShieldCheck,
  LogOut,
  LayoutGrid,
  TableProperties,
  RefreshCw,
  Zap,
  CheckCircle2,
} from "lucide-react";

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
    if (submitted.length === 0) return;
    setGenerating(true);
    setModifiedSlots(new Set());
    try {
      await apiGenerateSchedule();
      const result = await apiGetSchedule();
      setScheduleResult(result);
    } catch (e) {
      console.error(e);
      alert("生成排班失败，请稍后重试");
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
