"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../components/AuthContext";
import BrandMark from "../../components/BrandMark";
import { homeForRole, loginUrlFor } from "../../lib/auth-redirect";
import { getActiveOrganizerEventId, setActiveOrganizerEventId } from "../../lib/event-defaults";
import { listOrganizerEvents } from "../../lib/db";
import {
  NAV_ICONS,
  NavLinks,
  SidebarBrand,
  SidebarFooter,
  SidebarSection,
  organizerNav,
  siteNav,
} from "../../components/RoleNav";

function OrganizerSidebarBody({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [activeEventId, setActiveEventId] = useState("");
  const [eventsList, setEventsList] = useState<Array<{ id: string; title: string; category: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    const apply = (list: Array<{ id: string; title: string; category: string }>) => {
      if (cancelled) return;
      setEventsList(list);
      // The event in the URL is the active one; otherwise the last one used
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
          setActiveEventId(stored || list[0]?.id || "");
        }
      }
    };
    // Events owned by this organizer, drafts included
    if (user?.id) {
      listOrganizerEvents(user.id)
        .then((own) => apply(own.map((e) => ({ id: e.id, title: e.status === "draft" ? `${e.title} (draft)` : e.title, category: e.category }))))
        .catch(() => apply([]));
    }
    return () => {
      cancelled = true;
    };
  }, [pathname, user?.id]);

  const handleSwitchEvent = (newEventId: string) => {
    if (newEventId === "new") {
      router.push("/dashboard/organizer/events/new");
      onNavigate?.();
      return;
    }
    setActiveEventId(newEventId);
    setActiveOrganizerEventId(newEventId);

    // On an event tool page, open the same tool for the chosen event
    for (const tool of ["floor-plan", "ai-campaign", "qr-code"]) {
      if (pathname.includes(`/${tool}`)) {
        router.push(`/dashboard/organizer/events/${newEventId}/${tool}`);
        break;
      }
    }
    onNavigate?.();
  };

  const hasEvent = Boolean(activeEventId && eventsList.some((e) => e.id === activeEventId));

  return (
    <>
      <SidebarBrand roleLabel="Organizer" onNavigate={onNavigate} />

      {/* Which event the tools below work on */}
      <div className="sidebar-event-switch">
        <label htmlFor={onNavigate ? "organizer-event-switch-mobile" : "organizer-event-switch"} className="sidebar-event-switch-label">
          Acara aktif
        </label>
        <select
          id={onNavigate ? "organizer-event-switch-mobile" : "organizer-event-switch"}
          value={eventsList.length === 0 ? "new" : activeEventId}
          onChange={(e) => handleSwitchEvent(e.target.value)}
          className="sidebar-event-switch-select"
        >
          {eventsList.length === 0 ? (
            <option value="new">Buat acara pertama</option>
          ) : (
            eventsList.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))
          )}
        </select>
      </div>

      <nav className="sidebar-nav" aria-label="Navigasi organizer">
        <div className="space-y-1">
          <NavLinks items={organizerNav(pathname, activeEventId, hasEvent)} onNavigate={onNavigate} />
        </div>
        <SidebarSection title="Jelajahi">
          <NavLinks items={siteNav("organizer", pathname)} onNavigate={onNavigate} />
        </SidebarSection>
      </nav>
      <SidebarFooter onLogout={onLogout} />
    </>
  );
}

function OrganizerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  const currentPath = usePathname();
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role === "guest") {
      // Not signed in: sign in, then come back to this page
      router.replace(loginUrlFor(currentPath));
    } else if (user.role !== "organizer") {
      // Signed in with another role: send them to their own dashboard
      router.replace(homeForRole(user.role));
    }
  }, [isLoading, user, router, currentPath]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Hold the dashboard until the account is known, so pages never load data for the wrong person
  if (isLoading || !user || user.role !== "organizer") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Memeriksa akun...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" id="organizer-dashboard">
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
            <OrganizerSidebarBody onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar: stays in view so "Keluar" is always at its foot */}
      <aside className="dashboard-desktop-sidebar sidebar sidebar-sticky">
        <OrganizerSidebarBody onLogout={handleLogout} />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 min-h-screen">
        <div className="w-full max-w-6xl p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      }
    >
      <OrganizerLayoutContent>{children}</OrganizerLayoutContent>
    </Suspense>
  );
}
