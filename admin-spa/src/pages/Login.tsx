import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { User, Lock } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setToken = useAuthStore((s) => s.setToken);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        DbLoginName: username,
        Password: password,
      });

      const token: string | undefined = res.data?.token;
      if (!token) throw new Error("Không nhận được token từ server");

      setToken(token);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white border shadow-lg p-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight">
            Admin<span className="text-slate-500">SPA</span>
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Đăng nhập hệ thống quản trị
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {String(err)}
          </div>
        )}

        {/* Username */}
        <div className="mt-5">
          <label className="text-sm font-medium text-slate-700">
            Username
          </label>
          <div className="relative mt-1">
            <User
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative mt-1">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        {/* Button */}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-slate-400">
          © 2025 Admin SPA
        </div>
      </form>
    </div>
  );
}
