"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../components/AuthContext";

import {
  getAllOrganizerEvents,
  getActiveOrganizerEventId,
  setActiveOrganizerEventId,
} from "../../lib/event-defaults";

function OrganizerNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [activeEventId, setActiveEventId] = useState("1");
  const [eventsList, setEventsList] = useState<Array<{ id: string; title: string; category: string }>>([]);

  useEffect(() => {
    // 1. Load events list strictly owned by this organizer
    const list = getAllOrganizerEvents(user?.email);
    setEventsList(list);

    // 2. Detect eventId from pathname if present
    const match = pathname.match(/\/events\/([^/]+)/);
    if (match && match[1] && match[1] !== "new") {
      setActiveEventId(match[1]);
      setActiveOrganizerEventId(match[1]);
    } else {
      const stored = getActiveOrganizerEventId();
      if (list.length > 0 && !list.some((e) => e.id === stored)) {
        setActiveEventId(list[0].id);
        setActiveOrganizerEventId(list[0].id);
      } else {
        setActiveEventId(stored || (list[0]?.id || "1"));
      }
    }
  }, [pathname, user?.email]);

  const handleSwitchEvent = (newEventId: string) => {
    if (newEventId === "new") {
      router.push("/dashboard/organizer/events/new");
      if (onNavigate) onNavigate();
      return;
    }
    setActiveEventId(newEventId);
    setActiveOrganizerEventId(newEventId);

    // If currently on an event subpage (floor-plan, ai-campaign, qr-code), switch seamlessly
    if (pathname.includes("/floor-plan")) {
      router.push(`/dashboard/organizer/events/${newEventId}/floor-plan`);
    } else if (pathname.includes("/ai-campaign")) {
      router.push(`/dashboard/organizer/events/${newEventId}/ai-campaign`);
    } else if (pathname.includes("/qr-code")) {
      router.push(`/dashboard/organizer/events/${newEventId}/qr-code`);
    }
    if (onNavigate) onNavigate();
  };

  const navItems = [
    {
      href: "/dashboard/organizer",
      label: "Dashboard",
      isActive: pathname === "/dashboard/organizer",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/dashboard/organizer/events/new",
      label: "Buat Event",
      isActive: pathname === "/dashboard/organizer/events/new",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      href: `/dashboard/organizer/events/${activeEventId}/floor-plan`,
      label: "Floor Plan",
      isActive: pathname.includes("/floor-plan"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      href: `/dashboard/organizer/events/${activeEventId}/ai-campaign`,
      label: "AI Campaign",
      isActive: pathname.includes("/ai-campaign"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      href: `/dashboard/organizer/events/${activeEventId}/qr-code`,
      label: "QR Code",
      isActive: pathname.includes("/qr-code"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="2" width="8" height="8" rx="1" />
          <rect x="14" y="2" width="8" height="8" rx="1" />
          <rect x="2" y="14" width="8" height="8" rx="1" />
          <rect x="14" y="14" width="4" height="4" />
          <line x1="22" y1="18" x2="22" y2="22" />
          <line x1="18" y1="22" x2="22" y2="22" />
        </svg>
      ),
    },
    {
      href: "/dashboard/organizer#organizer-inbox",
      label: "Pesan Masuk",
      isActive: pathname === "/dashboard/organizer" && typeof window !== "undefined" && window.location.hash === "#organizer-inbox",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      href: "/dashboard/organizer/profile",
      label: "Profil",
      isActive: pathname === "/dashboard/organizer/profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Event Context Switcher Widget in Sidebar */}
      <div className="px-1">
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
          <div className="flex items-center justify-between mb-1.5 text-muted-foreground font-medium text-[11px]">
            <span>Acara Aktif</span>
            <span className="badge badge-primary text-[9px] py-0 px-1.5">ID #{activeEventId}</span>
          </div>
          <select
            value={activeEventId}
            onChange={(e) => handleSwitchEvent(e.target.value)}
            className="w-full bg-card/90 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
          >
            {eventsList.length === 0 ? (
              <option value="new">+ Buat Acara Pertama</option>
            ) : (
              eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Nav items */}
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${item.isActive ? "active" : ""}`}
            onClick={onNavigate}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavFallback() {
  return (
    <div className="space-y-1">
      <Link href="/dashboard/organizer" className="sidebar-link active">Dashboard</Link>
      <Link href="/dashboard/organizer/events/new" className="sidebar-link">Buat Event</Link>
      <Link href="/dashboard/organizer/events/1/floor-plan" className="sidebar-link">Floor Plan</Link>
    </div>
  );
}

function OrganizerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" id="organizer-dashboard">
      {/* Mobile header */}
      <div className="md:hidden glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <span className="font-bold text-sm">Boothify <span className="text-primary-light">Organizer</span></span>
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
              <span className="font-bold text-sm">Boothify <span className="text-primary-light">Organizer</span></span>
            </div>
            <Suspense fallback={<NavFallback />}>
              <OrganizerNavLinks onNavigate={() => setSidebarOpen(false)} />
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
            <span className="text-[10px] text-primary-light font-semibold">ORGANIZER</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          <Suspense fallback={<NavFallback />}>
            <OrganizerNavLinks />
          </Suspense>
        </nav>

        <div className="pt-4 border-t border-border mt-4">
          {user && (
            <div className="px-3 py-2 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.businessName || user.email}</p>
              {user.role === "tenant" && (
                <span className="badge badge-accent text-[9px] mt-1.5 inline-block py-0.5">Mode Tenant (Simulasi)</span>
              )}
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link text-xs w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        <div className="p-6 sm:p-8 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
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
      <OrganizerLayoutContent>{children}</OrganizerLayoutContent>
    </Suspense>
  );
}
