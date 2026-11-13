"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { homeForRole, safeNextPath } from "../../lib/auth-redirect";
import Navbar from "../../components/Navbar";
import BrandMark from "../../components/BrandMark";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Already signed in with a real account: go to that account's home.
  // A visitor who only ordered as a guest can still sign in or register.
  const signedIn = Boolean(user && user.role !== "guest");
  // Set once this form signs someone in, so the form's own redirect (to `next`) is the one that wins
  const submittedRef = useRef(false);
  useEffect(() => {
    if (submittedRef.current) return;
    if (user && user.role !== "guest") {
      router.replace(homeForRole(user.role));
    }
  }, [user, router]);

  if (signedIn) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    submittedRef.current = true;
    const result = login(email, password);
    if (!result.success) submittedRef.current = false;
    if (result.success) {
      // Read the role just stored, then return to where the person was heading
      const storedUser = localStorage.getItem("boothify_current_user");
      const role = storedUser ? JSON.parse(storedUser).role : undefined;
      router.replace(next || homeForRole(role));
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex pt-16" id="login-page">
      {/* Left panel - branding */}
      <div className="auth-panel hidden lg:flex lg:w-1/2 relative overflow-hidden items-center">
        <div className="relative z-10 max-w-md px-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <span className="wordmark text-3xl"><BrandMark size={32} /><span>Boothify</span></span>
          </Link>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">Selamat Datang Kembali!</h2>
          <p className="auth-panel-text leading-relaxed">
            Kelola event, booking booth, dan pantau semua aktivitas bisnis kamu dari satu platform terpadu.
          </p>
          {/* Decorative booth grid */}
          <div className="mt-12 grid grid-cols-4 gap-2 max-w-xs" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`h-12 auth-booth ${
                  i === 6
                    ? "auth-booth--picked"
                    : [3, 7, 11].includes(i)
                    ? "auth-booth--taken"
                    : ""
                }`}
              />
            ))}
          </div>
          <p className="auth-panel-text text-sm mt-4">Denah booth interaktif</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="wordmark text-2xl"><BrandMark size={24} /><span>Boothify</span></span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">Masuk ke Akun</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {next ? "Masuk dulu untuk melanjutkan ke halaman yang kamu buka." : "Masukkan email dan kata sandi untuk melanjutkan"}
          </p>

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
  <div className="relative flex items-center">
    <svg className="absolute left-3 z-10 pointer-events-none text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
    <input 
      id="login-email" 
      type="email" 
      className="input-base !pl-10 w-full" 
      placeholder="nama@email.com" 
      value={email} 
      onChange={(e) => setEmail(e.target.value)} 
      required 
    />
  </div>
</div>

{/* Password */}
<div>
  <div className="flex items-center justify-between mb-2">
    <label htmlFor="login-password" className="text-sm font-medium">Kata Sandi</label>
  </div>
  <div className="relative flex items-center">
    <svg className="absolute left-3 z-10 pointer-events-none text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
    <input 
      id="login-password" 
      type={showPassword ? "text" : "password"} 
      className="input-base !pl-10 !pr-10 w-full" 
      placeholder="••••••••" 
      value={password} 
      onChange={(e) => setPassword(e.target.value)} 
      required 
    />
    <button 
      type="button" 
      onClick={() => setShowPassword(!showPassword)} 
      className="absolute right-3 z-10 text-muted-foreground hover:text-foreground transition"
    >
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

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{" "}
            <Link href={next ? `/auth/register?next=${encodeURIComponent(next)}` : "/auth/register"} className="text-primary-light font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat halaman masuk...</div>}>
      <LoginContent />
    </Suspense>
  );
}
