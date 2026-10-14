"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const dashboardLink = user?.role === "organizer" ? "/dashboard/organizer" : user?.role === "tenant" ? "/dashboard/tenant" : "/events";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group" id="navbar-logo">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Booth<span className="gradient-text">ify</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/events" className="btn btn-ghost text-sm" id="nav-events">
              Jelajahi Event
            </Link>
            <Link href="/#features" className="btn btn-ghost text-sm" id="nav-pricing">
              Fitur
            </Link>
            <Link href="/#how-it-works" className="btn btn-ghost text-sm" id="nav-how-it-works">
              Cara Kerja
            </Link>
            
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role !== "guest" && <Link href={dashboardLink} className="btn btn-ghost text-sm" id="nav-dashboard">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  Dashboard
                </Link>}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <p className="font-medium truncate max-w-[100px]">{user.name}</p>
                    <p className="text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                <button onClick={logout} className="btn btn-ghost text-sm text-muted-foreground" id="nav-logout">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost text-sm" id="nav-login">
                  Masuk
                </Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm" id="nav-register">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            // PERBAIKAN: Gunakan md:!hidden untuk memaksa tombol hilang di desktop
            className="md:!hidden btn btn-ghost btn-icon"
            id="mobile-menu-toggle"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border animate-fade-in" id="mobile-navigation">
          <div className="px-4 py-4 space-y-2">
            <Link href="/events" className="block py-2 px-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>
              Jelajahi Event
            </Link>
            <Link href="/#features" className="block py-2 px-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>
              Fitur
            </Link>
            <Link href="/#how-it-works" className="block py-2 px-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>
              Cara Kerja
            </Link>
            {user ? (
              <>
                {user.role !== "guest" && <Link href={dashboardLink} className="block py-2 px-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>}
                <div className="flex items-center gap-2 py-2 px-3">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="badge badge-primary text-[10px] ml-auto">{user.role}</span>
                </div>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left py-2 px-3 rounded-lg text-sm text-error hover:bg-white/5 transition">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <hr className="border-border" />
                <Link href="/auth/login" className="block py-2 px-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>
                  Masuk
                </Link>
                <Link href="/auth/register" className="block py-2 px-3" onClick={() => setMobileOpen(false)}>
                  <span className="btn btn-primary btn-sm w-full">Daftar Gratis</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}