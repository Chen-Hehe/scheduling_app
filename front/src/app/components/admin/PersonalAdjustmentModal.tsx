import { useState, useRef, useMemo, useEffect } from "react";
import { Member, ScheduleResult } from "../../data/mockData";
import { TIME_COLORS, POSITION_COLORS, ROLE_MAX_COUNT, MAX_PER_SLOT, timeRange, getHeadcount, WeekType } from "../../data/constants";
import { apiGetPersonalAdjustment } from "../../api";
import { X, ToggleLeft, ToggleRight, User, AlertTriangle } from "lucide-react";

interface RelatedShift {
  slotKey: string;
  weekType: WeekType;
  day: string;
  time: string;
  preferenceRank: number | null;
  isAssigned: boolean;
  headcount: { ministers: number; viceMinistersCount: number; officers: number };
}

export function PersonalAdjustmentModal({ member, scheduleResult, onApply, onClose }: { member: Member; scheduleResult: ScheduleResult; onApply: (memberId: string, addedSlots: string[], removedSlots: string[]) => void; onClose: () => void; }) {
  const [relatedShifts, setRelatedShifts] = useState<RelatedShift[]>([]);
  const [loading, setLoading] = useState(true);
  const originalAssignment = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadPersonalAdjustment = async () => {
      try {
        const data = await apiGetPersonalAdjustment(member.studentId);
        const shiftsMap = new Map<string, RelatedShift>();
        
        data.related_shifts.forEach((rs) => {
          const parts = rs.shift_id.split("-");
          const weekType = parts[0] as WeekType;
          const day = parts[1];
          const time = parts[2];
          shiftsMap.set(rs.shift_id, {
            slotKey: rs.shift_id,
            weekType,
            day,
            time,
            preferenceRank: rs.preference_rank,
            isAssigned: rs.is_assigned,
            headcount: {
              ministers: rs.headcount.ministers,
              viceMinistersCount: rs.headcount.vice_ministers,
              officers: rs.headcount.officers,
            },
          });
        });
        
        const sorted = Array.from(shiftsMap.values()).sort((a, b) => {
          if (a.preferenceRank === null && b.preferenceRank === null) return 0;
          if (a.preferenceRank === null) return 1;
          if (b.preferenceRank === null) return -1;
          return a.preferenceRank - b.preferenceRank;
        });
        
        setRelatedShifts(sorted);
        originalAssignment.current = new Set(sorted.filter((s) => s.isAssigned).map((s) => s.slotKey));
      } catch (e) {
        console.error("Failed to load personal adjustment data:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadPersonalAdjustment();
  }, [member.studentId]);
  const maxCount = ROLE_MAX_COUNT[member.position] ?? 1;
  const currentCount = relatedShifts.filter((s) => s.isAssigned).length;
  const progressColor = currentCount < maxCount ? "text-orange-500 bg-orange-50 border-orange-200" : currentCount === maxCount ? "text-green-600 bg-green-50 border-green-200" : "text-red-500 bg-red-50 border-red-200";
  const progressDotColor = currentCount < maxCount ? "bg-orange-400" : currentCount === maxCount ? "bg-green-500" : "bg-red-500";
  const toggleShift = (slotKey: string) => { setRelatedShifts((prev) => prev.map((s) => (s.slotKey === slotKey ? { ...s, isAssigned: !s.isAssigned } : s))); };
  const handleConfirm = () => {
    const nowAssigned = new Set(relatedShifts.filter((s) => s.isAssigned).map((s) => s.slotKey));
    const orig = originalAssignment.current;
    const added: string[] = [];
    nowAssigned.forEach((k) => { if (!orig.has(k)) added.push(k); });
    const removed: string[] = [];
    orig.forEach((k) => { if (!nowAssigned.has(k)) removed.push(k); });
    onApply(member.studentId, added, removed);
    onClose();
  };
  const hasChanges = useMemo(() => {
    const nowAssigned = new Set(relatedShifts.filter((s) => s.isAssigned).map((s) => s.slotKey));
    const orig = originalAssignment.current;
    if (nowAssigned.size !== orig.size) return true;
    for (const k of nowAssigned) { if (!orig.has(k)) return true; }
    return false;
  }, [relatedShifts]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[88vh] flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>{member.name[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-gray-800" style={{ fontSize: "16px", fontWeight: 700 }}>{member.name}</h3>
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-500 text-sm">排班微调</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${POSITION_COLORS[member.position] ?? "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 600 }}>{member.position}</span>
                </div>
                <p className="text-gray-400 text-xs">{member.department} · {member.studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${progressColor}`}>
                <div className={`w-2 h-2 rounded-full ${progressDotColor} ${currentCount !== maxCount ? "animate-pulse" : ""}`} />
                <div className="text-center">
                  <p style={{ fontSize: "10px", fontWeight: 500 }} className="opacity-70">排班进度</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1 }}>{currentCount} <span style={{ fontSize: "12px", fontWeight: 400 }}>/</span> {maxCount}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">加载中…</p>
            </div>
          ) : relatedShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">该成员无相关班次数据</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-gray-500 text-xs" style={{ fontWeight: 600 }}>班次时间</th>
                  <th className="px-4 py-3 text-center text-gray-500 text-xs" style={{ fontWeight: 600 }}>志愿等级</th>
                  <th className="px-4 py-3 text-center text-gray-500 text-xs" style={{ fontWeight: 600 }}>当前班次人数</th>
                  <th className="px-5 py-3 text-center text-gray-500 text-xs" style={{ fontWeight: 600 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {relatedShifts.map((shift) => {
                  const tc = TIME_COLORS[shift.time] ?? TIME_COLORS["第一二节"];
                  const currentSlotMembers = scheduleResult[shift.slotKey] ?? [];
                  const wasAssigned = currentSlotMembers.some((m) => m.studentId === member.studentId);
                  let adjustedHc = { ...shift.headcount };
                  const isMinister = member.position === "部长" || member.position === "主席" || member.position === "副主席";
                  const isVice = member.position === "副部长";
                  if (shift.isAssigned && !wasAssigned) {
                    if (isMinister) adjustedHc.ministers++;
                    else if (isVice) adjustedHc.viceMinistersCount++;
                    else adjustedHc.officers++;
                  } else if (!shift.isAssigned && wasAssigned) {
                    if (isMinister) adjustedHc.ministers = Math.max(0, adjustedHc.ministers - 1);
                    else if (isVice) adjustedHc.viceMinistersCount = Math.max(0, adjustedHc.viceMinistersCount - 1);
                    else adjustedHc.officers = Math.max(0, adjustedHc.officers - 1);
                  }
                  const totalPeople = adjustedHc.ministers + adjustedHc.viceMinistersCount + adjustedHc.officers;
                  return (
                    <tr key={shift.slotKey} className={`border-b border-gray-100 transition-colors ${shift.isAssigned ? tc.light : "bg-white hover:bg-gray-50/50"}`}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tc.bg}`} /><div><p className="text-gray-700" style={{ fontWeight: 600, fontSize: "13px" }}>{shift.weekType} · {shift.day}</p><p className="text-gray-400" style={{ fontSize: "11px" }}>{shift.time} ({timeRange(shift.time)})</p></div></div></td>
                      <td className="px-4 py-3.5 text-center">{shift.preferenceRank !== null ? (<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${shift.preferenceRank === 1 ? "bg-blue-100 text-blue-700" : shift.preferenceRank === 2 ? "bg-blue-50 text-blue-600" : shift.preferenceRank <= 4 ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-400"}`} style={{ fontWeight: 600 }}>第{shift.preferenceRank}志愿</span>) : (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-500" style={{ fontWeight: 500 }}>调剂</span>)}</td>
                      <td className="px-4 py-3.5 text-center"><div className="inline-flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600" style={{ fontWeight: 600, fontSize: "10px" }}>部 {adjustedHc.ministers}</span><span className="text-gray-200">|</span><span className="px-1.5 py-0.5 rounded text-xs bg-sky-50 text-sky-600" style={{ fontWeight: 600, fontSize: "10px" }}>副 {adjustedHc.viceMinistersCount}</span><span className="text-gray-200">|</span><span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600" style={{ fontWeight: 600, fontSize: "10px" }}>干 {adjustedHc.officers}</span>{totalPeople >= MAX_PER_SLOT && (<span className="ml-1 text-orange-400" style={{ fontSize: "10px" }}>满</span>)}</div></td>
                      <td className="px-5 py-3.5 text-center"><button onClick={() => toggleShift(shift.slotKey)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${shift.isAssigned ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"}`} style={{ fontWeight: 600 }}>{shift.isAssigned ? (<><ToggleRight className="w-4 h-4" />已安排</>) : (<><ToggleLeft className="w-4 h-4" />未安排</>)}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {hasChanges && (<div className="flex items-center gap-1.5 text-orange-500"><AlertTriangle className="w-3.5 h-3.5" /><span style={{ fontWeight: 500 }}>有未保存的修改</span></div>)}
            {currentCount > maxCount && (<div className="flex items-center gap-1.5 text-red-500"><AlertTriangle className="w-3.5 h-3.5" /><span style={{ fontWeight: 500 }}>当前处于超排状态 ({currentCount}/{maxCount})</span></div>)}
            {currentCount < maxCount && !loading && (<div className="flex items-center gap-1.5 text-orange-500"><AlertTriangle className="w-3.5 h-3.5" /><span style={{ fontWeight: 500 }}>排班未满 ({currentCount}/{maxCount})</span></div>)}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontWeight: 500 }}>取消</button>
            <button onClick={handleConfirm} disabled={!hasChanges || loading} className={`px-5 py-2 rounded-xl text-xs transition-all duration-200 ${hasChanges && !loading ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`} style={{ fontWeight: 600 }}>确认修改</button>
          </div>
        </div>
      </div>
    </div>
  );
}
