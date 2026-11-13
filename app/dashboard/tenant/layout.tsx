"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../components/AuthContext";
import BrandMark from "../../components/BrandMark";
import { homeForRole, loginUrlFor } from "../../lib/auth-redirect";
import {
  NAV_ICONS,
  NavLinks,
  SidebarBrand,
  SidebarFooter,
  SidebarSection,
  siteNav,
  tenantNav,
} from "../../components/RoleNav";

function TenantSidebarBody({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <SidebarBrand roleLabel="Tenant / brand" onNavigate={onNavigate} />
      <nav className="sidebar-nav" aria-label="Navigasi tenant">
        <div className="space-y-1">
          <NavLinks items={tenantNav(pathname)} onNavigate={onNavigate} />
        </div>
        <SidebarSection title="Jelajahi">
          <NavLinks items={siteNav("tenant", pathname)} onNavigate={onNavigate} />
        </SidebarSection>
      </nav>
      <SidebarFooter onLogout={onLogout} />
    </>
  );
}

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = usePathname();
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role === "guest") {
      // Not signed in: sign in, then come back to this page
      router.replace(loginUrlFor(currentPath));
    } else if (user.role !== "tenant") {
      // Signed in with another role: send them to their own dashboard
      router.replace(homeForRole(user.role));
    }
  }, [isLoading, user, router, currentPath]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Hold the dashboard until the account is known, so pages never load data for the wrong person
  if (isLoading || !user || user.role !== "tenant") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Memeriksa akun...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" id="tenant-dashboard">
      {/* Mobile header */}
      <div className="dashboard-mobile-header glass sticky top-0 z-40 px-4 py-3 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary"><BrandMark size={20} /></span>
          <span className="wordmark text-base">Boothify</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn btn-ghost btn-icon"
          aria-label={sidebarOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={sidebarOpen}
        >
          {NAV_ICONS.menu}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {sidebarOpen && (
        <div className="dashboard-mobile-drawer fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-dark sidebar-drawer animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <TenantSidebarBody onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar: stays in view so "Keluar" is always at its foot */}
      <aside className="dashboard-desktop-sidebar sidebar sidebar-sticky">
        <TenantSidebarBody onLogout={handleLogout} />
      </aside>

      <div className="flex-1 min-w-0 min-h-screen">
        <div className="w-full max-w-6xl p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      }
    >
      <TenantLayoutContent>{children}</TenantLayoutContent>
    </Suspense>
  );
}
