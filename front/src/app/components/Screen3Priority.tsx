import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSchedule, Shift } from "../context/ScheduleContext";
import { useMembers } from "../context/MemberContext";
import { apiSubmitPreferences } from "../api";
import { StepIndicator } from "./StepIndicator";
import {
  ChevronLeft,
  GripVertical,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  ArrowUpDown,
  Info,
} from "lucide-react";

const ITEM_TYPE = "SHIFT";

const TIME_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string; pill: string }
> = {
  "第一二节": {
    icon: <Sun className="w-4 h-4" />,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    pill: "bg-amber-100 text-amber-600",
  },
  "第三四节": {
    icon: <Sunset className="w-4 h-4" />,
    color: "text-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    pill: "bg-sky-100 text-sky-600",
  },
  "第五六节": {
    icon: <Sunset className="w-4 h-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    pill: "bg-emerald-100 text-emerald-600",
  },
  "第七八节": {
    icon: <Moon className="w-4 h-4" />,
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    pill: "bg-violet-100 text-violet-600",
  },
};

const WEEK_PILL: Record<string, string> = {
  单周: "bg-orange-100 text-orange-600",
  双周: "bg-teal-100 text-teal-600",
};

interface DragItem {
  index: number;
  id: string;
}

interface ShiftCardProps {
  shift: Shift;
  index: number;
  moveShift: (dragIndex: number, hoverIndex: number) => void;
}

function ShiftCard({ shift, index, moveShift }: ShiftCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const config = TIME_CONFIG[shift.time] || TIME_CONFIG["上午"];

  const [{ isDragging }, drag, dragPreview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { index, id: shift.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveShift(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  const priorityLabel = ["第一", "第二", "第三", "第四", "第五", "第六", "第七"][index] ?? `第${index + 1}`;
  const priorityColor =
    index === 0
      ? "bg-blue-600 text-white"
      : index === 1
      ? "bg-blue-400 text-white"
      : index === 2
      ? "bg-blue-200 text-blue-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-4 bg-white rounded-2xl border transition-all duration-200 select-none ${
        isDragging
          ? "opacity-40 scale-95 shadow-none"
          : isOver && canDrop
          ? "border-blue-300 shadow-md shadow-blue-100 scale-100"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
      }`}
      style={{ cursor: "grab" }}
    >
      {/* Priority Badge */}
      <div
        className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${priorityColor}`}
      >
        <span style={{ fontSize: "9px", fontWeight: 500 }}>志愿</span>
        <span style={{ fontSize: "13px", fontWeight: 700 }}>{index + 1}</span>
      </div>

      {/* Shift Info */}
      <div className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl ${config.bg} ${config.border} border`}>
        <span className={config.color}>{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
              {shift.day} · {shift.time}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${WEEK_PILL[shift.week]}`}>
              {shift.week}
            </span>
          </div>
        </div>
      </div>

      {/* Drag Handle */}
      <div
        ref={dragPreview as unknown as React.RefObject<HTMLDivElement>}
        className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing px-1"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
}

function PriorityList() {
  const navigate = useNavigate();
  const { selectedShifts, reorderShifts, formData, setSubmitted } = useSchedule();
  const { allMembers, updateMember } = useMembers();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const moveShift = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const updated = [...selectedShifts];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      reorderShifts(updated);
    },
    [selectedShifts, reorderShifts]
  );

  const handleSubmit = async () => {
    if (selectedShifts.length === 0) {
      setSubmitError("请至少选择一个班次作为志愿。");
      return;
    }
    if (!formData.name.trim() || !formData.studentId.trim()) {
      setSubmitError("请先完成身份认证（姓名与学号）。");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiSubmitPreferences({
        student_id: formData.studentId.trim(),
        shifts: selectedShifts.map((shift, index) => ({
          shift_id: shift.id,
          rank: index + 1,
        })),
      });

      // 本地标记为已提交，方便当前端查看状态
      const member = allMembers.find((m) => m.studentId === formData.studentId.trim());
      if (member) {
        updateMember(member.id, {
          submitted: true,
          shifts: selectedShifts.map((s) => ({
            id: s.id,
            week: s.week,
            day: s.day,
            time: s.time,
          })),
        });
      }

      setSubmitted(true);
      setShowSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "提交失败，请稍后重试。";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>
            提交成功！
          </h2>
          <p className="text-gray-500 text-sm mb-6">您的排班志愿已成功提交，请等待安排结果。</p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">姓名</span>
              <span className="text-gray-700" style={{ fontWeight: 500 }}>{formData.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">学号</span>
              <span className="text-gray-700" style={{ fontWeight: 500 }}>{formData.studentId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">部门</span>
              <span className="text-gray-700" style={{ fontWeight: 500 }}>{formData.department}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">志愿数量</span>
              <span className="text-gray-700" style={{ fontWeight: 500 }}>{selectedShifts.length} 个班次</span>
            </div>
          </div>

          <div className="space-y-2 text-left mb-6">
            <p className="text-xs text-gray-400 text-center" style={{ fontWeight: 500 }}>
              志愿优先级顺序
            </p>
            {selectedShifts.slice(0, 5).map((shift, i) => {
              const config = TIME_CONFIG[shift.time] || TIME_CONFIG["上午"];
              return (
                <div
                  key={shift.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.bg} text-sm`}
                >
                  <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                  <span className={config.color}>{config.icon}</span>
                  <span className="text-gray-700 text-xs">{shift.day} · {shift.time} · {shift.week}</span>
                </div>
              );
            })}
            {selectedShifts.length > 5 && (
              <p className="text-xs text-center text-gray-400">...等共 {selectedShifts.length} 个志愿</p>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/");
              window.location.reload();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm transition-all"
            style={{ fontWeight: 600 }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-gray-800 mb-0.5" style={{ fontSize: "18px", fontWeight: 700 }}>
            志愿排班系统
          </h1>
          <p className="text-gray-400 text-xs">请按步骤填写您的排班志愿</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator
            currentStep={3}
            totalSteps={3}
            labels={["身份认证", "选择班次", "志愿排序"]}
          />
        </div>

        {/* Title */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-gray-700" style={{ fontSize: "15px", fontWeight: 600 }}>
              志愿优先级排序
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              共 {selectedShifts.length} 个班次，拖拽调整优先级
            </p>
          </div>
          <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2.5 py-1.5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="text-xs" style={{ fontWeight: 500 }}>拖拽排序</span>
          </div>
        </div>

        {/* Hint */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-600 text-xs leading-relaxed">
            第 1 志愿优先级最高，排班系统将优先按此顺序分配，请仔细确认后提交。
          </p>
        </div>

        {/* Drag List */}
        <div className="space-y-2.5 mb-6">
          {selectedShifts.map((shift, index) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              index={index}
              moveShift={moveShift}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-xs text-gray-400 mb-3" style={{ fontWeight: 500 }}>提交信息预览</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">姓名</p>
              <p className="text-gray-700" style={{ fontWeight: 600 }}>{formData.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">学号</p>
              <p className="text-gray-700" style={{ fontWeight: 600 }}>{formData.studentId}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">部门</p>
              <p className="text-gray-700" style={{ fontWeight: 600 }}>{formData.department}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">职位</p>
              <p className="text-gray-700" style={{ fontWeight: 600 }}>{formData.position}</p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/shift-select")}
            className="flex-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{ fontWeight: 500 }}
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-[2] text-white py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-100 ${
              submitting
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? "提交中..." : "确认提交志愿"}
          </button>
        </div>
        {submitError && (
          <p className="mt-3 text-xs text-red-500 text-center">{submitError}</p>
        )}
      </div>
    </div>
  );
}

export function Screen3Priority() {
  return (
    <DndProvider backend={HTML5Backend}>
      <PriorityList />
    </DndProvider>
  );
}