"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import BrandMark from "./BrandMark";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const dashboardLink =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "organizer"
      ? "/dashboard/organizer"
      : user?.role === "tenant"
      ? "/dashboard/tenant"
      : "/events";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role;

  return (
    <nav className="site-nav" id="main-navbar" aria-label="Navigasi utama">
      <div className="container site-nav-bar">
        {/* Wordmark, left */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="wordmark site-nav-wordmark"
          id="navbar-logo"
          aria-label="Boothify, ke beranda"
        >
          <BrandMark size={22} />
          <span>Boothify</span>
        </Link>

        <div className="site-nav-right">
          {/* Links */}
          <div className="site-nav-links">
            <Link href="/events" className="site-nav-link" id="nav-events">
              Jelajahi Event
            </Link>
            <Link href="/#features" className="site-nav-link" id="nav-pricing">
              Fitur
            </Link>
            <Link href="/#how-it-works" className="site-nav-link" id="nav-how-it-works">
              Cara Kerja
            </Link>
          </div>
          {/* Account */}
          <div className="site-nav-account">
            {user && user.role !== "guest" ? (
              <>
                <Link href={dashboardLink} className="site-nav-link" id="nav-dashboard">
                    Dashboard
                  </Link>
                <div className="site-nav-user">
                  <span className="site-nav-avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="site-nav-user-text">
                    <span className="site-nav-user-name">{user.name}</span>
                    <span className="site-nav-user-role">{roleLabel}</span>
                  </span>
                </div>
                <button type="button" onClick={logout} className="btn btn-ghost btn-sm" id="nav-logout">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="site-nav-link" id="nav-login">
                  Masuk
                </Link>
                <Link href="/auth/register" className="btn btn-secondary btn-sm" id="nav-register">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn-ghost btn-icon site-nav-toggle"
          id="mobile-menu-toggle"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="site-nav-drawer" id="mobile-navigation">
          <div className="container site-nav-drawer-inner">
            <Link href="/events" className="site-nav-drawer-link" onClick={() => setMobileOpen(false)}>
              Jelajahi Event
            </Link>
            <Link href="/#features" className="site-nav-drawer-link" onClick={() => setMobileOpen(false)}>
              Fitur
            </Link>
            <Link href="/#how-it-works" className="site-nav-drawer-link" onClick={() => setMobileOpen(false)}>
              Cara Kerja
            </Link>
            {user && user.role !== "guest" ? (
              <>
                <Link href={dashboardLink} className="site-nav-drawer-link" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                <div className="site-nav-user site-nav-drawer-user">
                  <span className="site-nav-avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="site-nav-user-text">
                    <span className="site-nav-user-name">{user.name}</span>
                    <span className="site-nav-user-role">{roleLabel}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="site-nav-drawer-link site-nav-drawer-logout"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="site-nav-drawer-link" onClick={() => setMobileOpen(false)}>
                  Masuk
                </Link>
                <Link href="/auth/register" className="btn btn-primary site-nav-drawer-cta" onClick={() => setMobileOpen(false)}>
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
