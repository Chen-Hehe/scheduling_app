import { useState } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate a small delay for realism
    await new Promise((r) => setTimeout(r, 600));
    const success = login(username, password);
    setLoading(false);
    if (success) {
      navigate("/admin/dashboard");
    } else {
      setError("用户名或密码错误，请重试");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,179,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/50 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white mb-1" style={{ fontSize: "22px", fontWeight: 700 }}>
            管理员登录
          </h1>
          <p className="text-blue-300/60 text-sm">排班管理系统 · 后台入口</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          {/* Username */}
          <div className="mb-4">
            <label className="block text-blue-200/70 text-xs mb-2" style={{ fontWeight: 500 }}>
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 w-4 h-4" />
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/8 border border-white/10 text-white placeholder-blue-300/30 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-blue-200/70 text-xs mb-2" style={{ fontWeight: 500 }}>
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                className="w-full border border-white/10 text-white placeholder-blue-300/30 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-blue-400/50 transition-all"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                验证中…
              </>
            ) : (
              "登录管理后台"
            )}
          </button>

          {/* Hint */}
          <p className="text-center text-blue-300/30 text-xs mt-4">
            演示账号：admin / admin123
          </p>
        </div>

        {/* Back to user side */}
        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/")}
            className="text-blue-300/40 hover:text-blue-300/70 text-xs transition-colors"
          >
            ← 返回用户端
          </button>
        </div>
      </div>
    </div>
  );
}
