"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../components/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard/tenant", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { href: "/dashboard/tenant/events", label: "Cari Event", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
  { href: "/dashboard/tenant/catalog", label: "Katalog Produk", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg> },
  { href: "/dashboard/tenant/bookings", label: "Pesanan & Booth", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { href: "/dashboard/tenant/profile", label: "Profil", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
];

function TenantNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
          onClick={onNavigate}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </>
  );
}

function NavFallback() {
  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className="sidebar-link">
          {item.icon} {item.label}
        </Link>
      ))}
    </div>
  );
}

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "tenant")) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" id="tenant-dashboard">
      {/* Mobile header */}
      <div className="md:hidden glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <span className="font-bold text-sm">Boothify <span className="text-secondary-light">Tenant</span></span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-ghost btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-card border-r border-border p-4 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-8 mt-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <span className="font-bold text-sm">Boothify <span className="text-secondary-light">Tenant</span></span>
            </div>
            <Suspense fallback={<NavFallback />}>
              <TenantNavLinks onNavigate={() => setSidebarOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex sidebar">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <div>
            <span className="font-bold text-sm block">Boothify</span>
            <span className="text-[10px] text-secondary-light font-semibold">TENANT / BRAND</span>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          <Suspense fallback={<NavFallback />}>
            <TenantNavLinks />
          </Suspense>
        </nav>
        <div className="pt-4 border-t border-border mt-4">
          {user && (
            <div className="px-3 py-2 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.businessName || user.email}</p>
              {user.role === "organizer" && (
                <span className="badge badge-accent text-[9px] mt-1.5 inline-block py-0.5">Mode Organizer (Simulasi)</span>
              )}
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link text-xs w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Keluar
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-screen">
        <div className="p-6 sm:p-8 max-w-6xl">{children}</div>
      </div>
    </div>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin mx-auto mb-3 text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <p className="text-sm text-muted-foreground">Memuat...</p>
          </div>
        </div>
      }
    >
      <TenantLayoutContent>{children}</TenantLayoutContent>
    </Suspense>
  );
}
