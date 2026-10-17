"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Memverifikasi otoritas Super Admin...</p>
        </div>
      </div>
    );
  }

  // Route guard: Access restricted strictly to Admin role
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="card-base max-w-md w-full p-8 text-center border border-purple-500/20 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
            🔒
          </div>
          <h1 className="text-xl font-bold mb-2">Akses Khusus Super Admin</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Halaman ini berada di tingkat tertinggi platform dan hanya dapat diakses oleh Administrator resmi untuk mengelola Campaign Master dan kurasi event organizer.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/auth/login"
              className="btn btn-primary w-full text-xs py-2.5 shadow-md"
              id="admin-login-redirect-btn"
            >
              Masuk sebagai Admin
            </Link>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn btn-ghost w-full text-xs py-2 text-muted-foreground"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-lg">👑</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight">
                    Booth<span className="gradient-text">ify</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    SUPER ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  Pusat Kurasi Campaign &amp; Penyelarasan Event Organizer
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs">🛡️</span>
              <span className="text-xs text-purple-200 font-medium">Tingkat Hak Akses Tertinggi</span>
            </div>

            <Link
              href="/events"
              className="btn btn-secondary btn-sm text-xs py-1.5 px-3 hidden sm:inline-flex"
            >
              Lihat Katalog Publik →
            </Link>

            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-red-400"
              id="admin-logout-btn"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
