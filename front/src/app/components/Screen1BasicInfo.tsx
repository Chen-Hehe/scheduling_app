import { useState } from "react";
import { useNavigate } from "react-router";
import { useSchedule } from "../context/ScheduleContext";
import { useMembers } from "../context/MemberContext";
import { StepIndicator } from "./StepIndicator";
import { User, Hash, ChevronRight, ShieldCheck, AlertCircle, CheckCircle2, Building2, Briefcase } from "lucide-react";

export function Screen1BasicInfo() {
  const navigate = useNavigate();
  const { formData, setFormData } = useSchedule();
  const { allMembers } = useMembers();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "请输入姓名";
    if (!formData.studentId.trim()) newErrors.studentId = "请输入学号";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setVerifying(true);
    // Simulate API verification delay
    await new Promise((r) => setTimeout(r, 800));

    const found = allMembers.find(
      (m) => m.name === formData.name.trim() && m.studentId === formData.studentId.trim()
    );

    setVerifying(false);

    if (found) {
      setFormData({
        name: found.name,
        studentId: found.studentId,
        department: found.department,
        position: found.position,
      });
      setVerified(true);
      setErrors({});
    } else {
      setErrors({ general: "查无此人，请核对姓名和学号，或联系管理员" });
      setVerified(false);
    }
  };

  const handleNext = () => {
    if (verified) {
      navigate("/shift-select");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-gray-800 mb-1" style={{ fontSize: "18px", fontWeight: 700 }}>
            志愿排班系统
          </h1>
          <p className="text-gray-400 text-xs">请按步骤填写您的排班志愿</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            currentStep={1}
            totalSteps={3}
            labels={["身份认证", "选择班次", "志愿排序"]}
          />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="mb-2">
            <h2 className="text-gray-700" style={{ fontSize: "15px", fontWeight: 600 }}>
              身份认证
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">请输入您的姓名和学号进行身份验证</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              <span className="text-red-400">*</span> 姓名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder="请输入您的姓名"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value, department: "", position: "" });
                  setErrors({});
                  setVerified(false);
                }}
                disabled={verified}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.name
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : verified
                    ? "border-green-200 bg-green-50 text-gray-600"
                    : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                }`}
              />
              {verified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />}
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              <span className="text-red-400">*</span> 学号
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder="请输入您的学号"
                value={formData.studentId}
                onChange={(e) => {
                  setFormData({ ...formData, studentId: e.target.value, department: "", position: "" });
                  setErrors({});
                  setVerified(false);
                }}
                disabled={verified}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.studentId
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : verified
                    ? "border-green-200 bg-green-50 text-gray-600"
                    : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                }`}
              />
              {verified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />}
            </div>
            {errors.studentId && <p className="text-red-400 text-xs mt-1">{errors.studentId}</p>}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-500 text-xs">{errors.general}</p>
            </div>
          )}

          {/* Verified Info Card */}
          {verified && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-green-700 text-xs" style={{ fontWeight: 600 }}>身份验证成功</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-green-100">
                  <Building2 className="w-3.5 h-3.5 text-green-400" />
                  <div>
                    <p className="text-gray-400" style={{ fontSize: "10px" }}>部门</p>
                    <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{formData.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-green-100">
                  <Briefcase className="w-3.5 h-3.5 text-green-400" />
                  <div>
                    <p className="text-gray-400" style={{ fontSize: "10px" }}>职位</p>
                    <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{formData.position}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verify / Next Button */}
        {!verified ? (
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            {verifying ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                正在验证…
              </>
            ) : (
              <>
                验证身份
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              style={{ fontWeight: 600 }}
            >
              下一步：选择班次
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setVerified(false);
                setFormData({ name: "", studentId: "", department: "", position: "" });
                setErrors({});
              }}
              className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 py-2.5 rounded-2xl text-xs transition-all"
            >
              重新验证
            </button>
          </div>
        )}

        {/* Admin Entry */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/admin/login")}
            className="inline-flex items-center gap-1.5 text-gray-300 hover:text-gray-400 text-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            管理员入口
          </button>
        </div>
      </div>
    </div>
  );
}