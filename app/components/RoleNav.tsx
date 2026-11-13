"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import BrandMark from "./BrandMark";
import { getActiveOrganizerEventId } from "../lib/event-defaults";
import { listOrganizerEvents } from "../lib/db";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  badge?: string;
};

const svg = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
    {children}
  </svg>
);

export const NAV_ICONS = {
  dashboard: svg(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
  search: svg(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>),
  catalog: svg(<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>),
  website: svg(<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>),
  orders: svg(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>),
  profile: svg(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  create: svg(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>),
  floorPlan: svg(<><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>),
  campaign: svg(<><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>),
  qr: svg(<><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" /><line x1="22" y1="18" x2="22" y2="22" /><line x1="18" y1="22" x2="22" y2="22" /></>),
  star: svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />),
  mail: svg(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>),
  features: svg(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>),
  route: svg(<><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15" /><circle cx="18" cy="5" r="3" /></>),
  logout: svg(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>),
  menu: svg(<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>),
};

/** Tenant sidebar, Dashboard first. */
export function tenantNav(pathname: string): NavItem[] {
  return [
    { href: "/dashboard/tenant", label: "Dashboard", icon: NAV_ICONS.dashboard, isActive: pathname === "/dashboard/tenant" },
    { href: "/dashboard/tenant/events", label: "Cari Event", icon: NAV_ICONS.search, isActive: pathname.startsWith("/dashboard/tenant/events") },
    { href: "/dashboard/tenant/catalog", label: "Katalog Produk", icon: NAV_ICONS.catalog, isActive: pathname.startsWith("/dashboard/tenant/catalog") },
    { href: "/dashboard/tenant/mini-website", label: "Mini Website Builder", icon: NAV_ICONS.website, isActive: pathname.startsWith("/dashboard/tenant/mini-website") },
    { href: "/dashboard/tenant/bookings", label: "Pesanan & Booth", icon: NAV_ICONS.orders, isActive: pathname.startsWith("/dashboard/tenant/bookings") },
    { href: "/dashboard/tenant/profile", label: "Profil", icon: NAV_ICONS.profile, isActive: pathname.startsWith("/dashboard/tenant/profile") },
  ];
}

/**
 * Organizer sidebar, Dashboard first. Event tools open the active event, or a
 * "no event yet" page when the organizer has not created one.
 */
export function organizerNav(pathname: string, activeEventId: string, hasEvent: boolean): NavItem[] {
  const tool = (name: string) =>
    hasEvent && activeEventId ? `/dashboard/organizer/events/${activeEventId}/${name}` : `/dashboard/organizer/no-event/${name}`;
  return [
    { href: "/dashboard/organizer", label: "Dashboard", icon: NAV_ICONS.dashboard, isActive: pathname === "/dashboard/organizer" },
    { href: "/dashboard/organizer/events/new", label: "Buat Event", icon: NAV_ICONS.create, isActive: pathname === "/dashboard/organizer/events/new" },
    { href: tool("floor-plan"), label: "Floor Plan", icon: NAV_ICONS.floorPlan, isActive: pathname.includes("/floor-plan") },
    { href: tool("ai-campaign"), label: "Ide Campaign", icon: NAV_ICONS.campaign, isActive: pathname.includes("/ai-campaign") },
    { href: tool("qr-code"), label: "QR Code", icon: NAV_ICONS.qr, isActive: pathname.includes("/qr-code") },
    { href: "/dashboard/organizer/campaigns", label: "Campaign Admin", icon: NAV_ICONS.star, isActive: pathname.startsWith("/dashboard/organizer/campaigns"), badge: "Free Tax" },
    { href: "/dashboard/organizer/messages", label: "Pesan Masuk", icon: NAV_ICONS.mail, isActive: pathname === "/dashboard/organizer/messages" },
    { href: "/dashboard/organizer/profile", label: "Profil", icon: NAV_ICONS.profile, isActive: pathname === "/dashboard/organizer/profile" },
  ];
}

/** The public site's links, kept in the sidebar once someone is signed in. */
export function siteNav(role: "tenant" | "organizer", pathname: string): NavItem[] {
  const items: NavItem[] = [];
  if (role === "organizer") {
    items.push({ href: "/events", label: "Cari Event", icon: NAV_ICONS.search, isActive: pathname === "/events" });
  }
  items.push(
    { href: "/#features", label: "Fitur", icon: NAV_ICONS.features, isActive: false },
    { href: "/#how-it-works", label: "Cara Kerja", icon: NAV_ICONS.route, isActive: false },
  );
  return items;
}

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`sidebar-link ${item.isActive ? "active" : ""}`}
          aria-current={item.isActive ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.icon}
          <span className="sidebar-link-label">{item.label}</span>
          {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
        </Link>
      ))}
    </>
  );
}

export function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sidebar-section">
      <p className="sidebar-section-title">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/** The signed-in person and the way out, pinned to the bottom of the sidebar. */
export function SidebarFooter({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  return (
    <div className="sidebar-footer">
      {user && (
        <div className="sidebar-user">
          <p className="sidebar-user-name">{user.name}</p>
          <p className="sidebar-user-meta">{user.businessName || user.email}</p>
        </div>
      )}
      <button type="button" onClick={onLogout} className="sidebar-link sidebar-logout" id="sidebar-logout">
        {NAV_ICONS.logout}
        <span className="sidebar-link-label">Keluar</span>
      </button>
    </div>
  );
}

export function SidebarBrand({ roleLabel, onNavigate }: { roleLabel: string; onNavigate?: () => void }) {
  return (
    <Link href="/" className="sidebar-brand" onClick={onNavigate}>
      <span className="text-primary"><BrandMark size={24} /></span>
      <span className="grid gap-1">
        <span className="wordmark text-lg block">Boothify</span>
        <span className="sidebar-brand-role">{roleLabel}</span>
      </span>
    </Link>
  );
}

/**
 * On public pages a signed-in tenant or organizer gets the same sidebar as the
 * dashboard instead of the top bar.
 */
export function PublicRoleShell({ role }: { role: "tenant" | "organizer" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [eventContext, setEventContext] = useState({ id: "", has: false });

  useEffect(() => {
    document.body.dataset.shell = "sidebar";
    return () => {
      delete document.body.dataset.shell;
    };
  }, []);

  useEffect(() => {
    if (role !== "organizer" || !user?.id) return;
    let cancelled = false;
    listOrganizerEvents(user.id)
      .then((own) => {
        if (cancelled) return;
        const stored = getActiveOrganizerEventId();
        const id = own.some((e) => e.id === stored) ? stored : own[0]?.id || "";
        setEventContext({ id, has: own.length > 0 });
      })
      .catch(() => {
        if (!cancelled) setEventContext({ id: "", has: false });
      });
    return () => {
      cancelled = true;
    };
  }, [role, user?.id]);

  const main = role === "tenant" ? tenantNav(pathname) : organizerNav(pathname, eventContext.id, eventContext.has);
  const site = siteNav(role, pathname);
  const roleLabel = role === "tenant" ? "Tenant / brand" : "Organizer";
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const body = (onNavigate?: () => void) => (
    <>
      <SidebarBrand roleLabel={roleLabel} onNavigate={onNavigate} />
      <nav className="sidebar-nav" aria-label="Navigasi akun">
        <div className="space-y-1">
          <NavLinks items={main} onNavigate={onNavigate} />
        </div>
        <SidebarSection title="Jelajahi">
          <NavLinks items={site} onNavigate={onNavigate} />
        </SidebarSection>
      </nav>
      <SidebarFooter onLogout={handleLogout} />
    </>
  );

  return (
    <>
      <div className="role-shell-mobile dashboard-mobile-header glass">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary"><BrandMark size={20} /></span>
          <span className="wordmark text-base">Boothify</span>
        </Link>
        <button type="button" onClick={() => setOpen(!open)} className="btn btn-ghost btn-icon" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open}>
          {NAV_ICONS.menu}
        </button>
      </div>
      {open && (
        <div className="dashboard-mobile-drawer fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="sidebar-dark sidebar-drawer animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            {body(() => setOpen(false))}
          </div>
        </div>
      )}
      <aside className="role-shell-sidebar dashboard-desktop-sidebar sidebar">{body()}</aside>
    </>
  );
}
