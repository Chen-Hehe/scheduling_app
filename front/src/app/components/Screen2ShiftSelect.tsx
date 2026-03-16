 import { useState } from "react";
import { useNavigate } from "react-router";
import { useSchedule } from "../context/ScheduleContext";
import { StepIndicator } from "./StepIndicator";
import { ChevronLeft, ChevronRight, CheckCircle2, Ban } from "lucide-react";

// 周日不值班，只保留周一至周六
const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六"];

interface TimeSlot {
  label: string;   // 节次名
  range: string;   // 时间范围
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "第一二节", range: "9:50–12:00" },
  { label: "第三四节", range: "12:00–14:10" },
  { label: "第五六节", range: "14:10–16:15" },
  { label: "第七八节", range: "16:15–17:30" },
];

// 周六只有第一二节可选
// 第三四节只有副部长可以选择
const isDisabled = (day: string, timeLabel: string, position: string): boolean => {
  if (day === "周六" && timeLabel !== "第一二节") return true;
  if (timeLabel === "第三四节" && position !== "副部长") return true;
  return false;
};

const TIME_COLORS: Record<string, {
  bg: string;
  selected: string;
  hover: string;
  text: string;
  badge: string;
  dot: string;
}> = {
  "第一二节": {
    bg: "bg-amber-50",
    selected: "bg-amber-400 border-amber-400",
    hover: "hover:bg-amber-50 hover:border-amber-200",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-600",
    dot: "bg-amber-400",
  },
  "第三四节": {
    bg: "bg-sky-50",
    selected: "bg-sky-500 border-sky-500",
    hover: "hover:bg-sky-50 hover:border-sky-200",
    text: "text-sky-600",
    badge: "bg-sky-100 text-sky-600",
    dot: "bg-sky-500",
  },
  "第五六节": {
    bg: "bg-emerald-50",
    selected: "bg-emerald-500 border-emerald-500",
    hover: "hover:bg-emerald-50 hover:border-emerald-200",
    text: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-600",
    dot: "bg-emerald-500",
  },
  "第七八节": {
    bg: "bg-violet-50",
    selected: "bg-violet-500 border-violet-500",
    hover: "hover:bg-violet-50 hover:border-violet-200",
    text: "text-violet-600",
    badge: "bg-violet-100 text-violet-600",
    dot: "bg-violet-500",
  },
};

type WeekType = "单周" | "双周";

export function Screen2ShiftSelect() {
  const navigate = useNavigate();
  const { toggleShift, isShiftSelected, selectedShifts, formData } = useSchedule();
  const [activeWeek, setActiveWeek] = useState<WeekType>("单周");

  const totalSelected = selectedShifts.length;

  // Count selected for current week view
  const currentWeekSelected = selectedShifts.filter((s) => s.week === activeWeek).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-gray-800 mb-0.5" style={{ fontSize: "18px", fontWeight: 700 }}>
              志愿排班系统
            </h1>
            <p className="text-gray-400 text-xs">请按步骤填写您的排班志愿</p>
          </div>
          {totalSelected > 0 && (
            <div
              className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs"
              style={{ fontWeight: 600 }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              已选 {totalSelected} 个
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-3 py-5 max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="mb-5">
          <StepIndicator
            currentStep={2}
            totalSteps={3}
            labels={["身份认证", "选择班次", "志愿排序"]}
          />
        </div>

        {/* Title + Week Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-gray-700" style={{ fontSize: "15px", fontWeight: 600 }}>
              选择可用班次
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              点击格子选择 / 取消，单双周分别填写
            </p>
          </div>

          {/* Week Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["单周", "双周"] as WeekType[]).map((w) => (
              <button
                key={w}
                onClick={() => setActiveWeek(w)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  activeWeek === w
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontWeight: activeWeek === w ? 600 : 400 }}
              >
                {w}
                {selectedShifts.filter((s) => s.week === w).length > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-white ${
                      activeWeek === w ? "bg-blue-500" : "bg-gray-400"
                    }`}
                    style={{ fontSize: "10px" }}
                  >
                    {selectedShifts.filter((s) => s.week === w).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Day Headers — 6 days + 1 label col = 7 cols */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "auto repeat(6, 1fr)" }}>
            {/* empty corner */}
            <div className="bg-gray-50 px-2 py-3 min-w-[72px]" />
            {DAYS.map((day) => (
              <div
                key={day}
                className={`py-3 text-center text-xs border-l border-gray-100 bg-gray-50 ${
                  day === "周六" ? "text-red-400" : "text-gray-500"
                }`}
                style={{ fontWeight: 600 }}
              >
                {day}
                {day === "周六" && (
                  <div className="text-gray-300 mt-0.5" style={{ fontSize: "9px" }}>仅上午</div>
                )}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {TIME_SLOTS.map((slot, slotIdx) => {
            const colors = TIME_COLORS[slot.label];
            return (
              <div
                key={slot.label}
                className={`grid border-b border-gray-100 last:border-b-0`}
                style={{ gridTemplateColumns: "auto repeat(6, 1fr)" }}
              >
                {/* Time Label */}
                <div
                  className={`${colors.bg} flex flex-col items-center justify-center py-4 px-2 border-r border-gray-100 min-w-[72px]`}
                >
                  <span className={`text-xs ${colors.text}`} style={{ fontWeight: 700 }}>
                    {slot.label}
                  </span>
                  <span className="text-gray-400 mt-1 text-center leading-tight" style={{ fontSize: "9px" }}>
                    {slot.range}
                  </span>
                </div>

                {/* Day Cells */}
                {DAYS.map((day) => {
                  const disabled = isDisabled(day, slot.label, formData.position);
                  const selected = !disabled && isShiftSelected(activeWeek, day, slot.label);

                  return (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() =>
                        !disabled && toggleShift({ week: activeWeek, day, time: slot.label })
                      }
                      className={`relative border-l border-gray-100 py-5 transition-all duration-150 ${
                        disabled
                          ? "bg-gray-50 cursor-not-allowed"
                          : selected
                          ? `${colors.selected} text-white`
                          : `bg-white ${colors.hover} border-transparent`
                      }`}
                    >
                      {disabled ? (
                        <div className="flex items-center justify-center">
                          <Ban className="w-3.5 h-3.5 text-gray-200" />
                        </div>
                      ) : selected ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
          {TIME_SLOTS.map((slot) => {
            const colors = TIME_COLORS[slot.label];
            const count = selectedShifts.filter(
              (s) => s.week === activeWeek && s.time === slot.label
            ).length;
            return (
              <div
                key={slot.label}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.badge}`}
              >
                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className="text-xs">{slot.label}</span>
                {count > 0 && (
                  <span className="text-xs" style={{ fontWeight: 700 }}>
                    ×{count}
                  </span>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
            <Ban className="w-3 h-3" />
            <span className="text-xs">不可选</span>
          </div>
        </div>

        {/* Permission hint for non-vice-ministers */}
        {formData.position !== "副部长" && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            <p className="text-amber-600 text-xs">
              提示：第三四节（12:00–14:10）仅限副部长填写
            </p>
          </div>
        )}

        {/* Hint when nothing selected */}
        {totalSelected === 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
            <p className="text-blue-500 text-xs">
              请在上方课表中点击选择您可以值班的时间段（单双周可分别设置）
            </p>
          </div>
        )}

        {/* Hint when less than 4 selected */}
        {totalSelected > 0 && totalSelected < 4 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            <p className="text-red-500 text-xs" style={{ fontWeight: 500 }}>
              请至少选择 4 个空闲时间段（当前已选 {totalSelected} 个，还需 {4 - totalSelected} 个）
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{ fontWeight: 500 }}
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={() => navigate("/priority")}
            disabled={totalSelected < 4}
            className={`flex-[2] py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              totalSelected >= 4
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
            style={{ fontWeight: 600 }}
          >
            下一步：志愿排序
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}