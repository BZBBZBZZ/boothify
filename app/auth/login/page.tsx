"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(user.role === "organizer" ? "/dashboard/organizer" : "/dashboard/tenant");
    }
  }, [user, router]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = login(email, password);
    if (result.success) {
      // Re-read user from localStorage to get role for redirect
      const storedUser = localStorage.getItem("boothify_current_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        router.push(userData.role === "organizer" ? "/dashboard/organizer" : "/dashboard/tenant");
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex" id="login-page">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-secondary/20" />
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[100px] animate-float delay-300" />
        <div className="relative z-10 max-w-md text-center px-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-2xl font-bold">
              Booth<span className="gradient-text">ify</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Selamat Datang Kembali!</h2>
          <p className="text-muted leading-relaxed">
            Kelola event, booking booth, dan pantau semua aktivitas bisnis kamu dari satu platform terpadu.
          </p>
          {/* Decorative booth grid */}
          <div className="mt-12 grid grid-cols-4 gap-3 max-w-xs mx-auto">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`h-12 rounded-lg ${
                  [2, 5, 6, 9, 10, 13].includes(i)
                    ? "bg-primary/20 border border-primary/30"
                    : [3, 7, 11].includes(i)
                    ? "bg-secondary/15 border border-secondary/20"
                    : "bg-white/5 border border-white/10"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Denah booth interaktif</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-xl font-bold">
                Booth<span className="gradient-text">ify</span>
              </span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">Masuk ke Akun</h1>
          <p className="text-muted-foreground text-sm mb-8">Masukkan email dan kata sandi untuk melanjutkan</p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-sm text-error animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <input id="login-email" type="email" className="input-base pl-10" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="text-sm font-medium">Kata Sandi</label>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <input id="login-password" type={showPassword ? "text" : "password"} className="input-base pl-10 pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" id="login-submit">
              Masuk
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick demo access */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">🚀 Demo Cepat — klik untuk langsung masuk:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("demo-organizer@boothify.id");
                  setPassword("demo1234");
                  // Auto register demo user if not exists
                  const users = JSON.parse(localStorage.getItem("boothify_users") || "[]");
                  if (!users.find((u: { email: string }) => u.email === "demo-organizer@boothify.id")) {
                    users.push({ name: "Demo Organizer", email: "demo-organizer@boothify.id", password: "demo1234", role: "organizer", businessName: "PT. Event Demo", phone: "+62 812 0000 0001" });
                    localStorage.setItem("boothify_users", JSON.stringify(users));
                  }
                }}
                className="btn btn-secondary btn-sm text-xs"
                id="demo-organizer-btn"
              >
                📅 Demo Organizer
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("demo-tenant@boothify.id");
                  setPassword("demo1234");
                  const users = JSON.parse(localStorage.getItem("boothify_users") || "[]");
                  if (!users.find((u: { email: string }) => u.email === "demo-tenant@boothify.id")) {
                    users.push({ name: "Demo Tenant", email: "demo-tenant@boothify.id", password: "demo1234", role: "tenant", businessName: "Demo Brand", businessCategory: "fashion", phone: "+62 812 0000 0002" });
                    localStorage.setItem("boothify_users", JSON.stringify(users));
                  }
                }}
                className="btn btn-secondary btn-sm text-xs"
                id="demo-tenant-btn"
              >
                🏪 Demo Tenant
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Klik tombol demo → lalu klik &quot;Masuk&quot;</p>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="text-primary-light font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
