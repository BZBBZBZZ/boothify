"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import {
  AdminCampaign,
  CampaignApplication,
  getAdminCampaigns,
  getCampaignApplications,
  submitCampaignApplication,
  calculateAlignmentScore,
} from "@/app/lib/admin-campaigns";
import { getEventsFromSupabase } from "@/app/lib/supabase-service";

export default function OrganizerCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [myEvents, setMyEvents] = useState<Array<{ id: string; title: string; category?: string; location?: string; date?: string; organizerEmail?: string }>>([]);

  // Modal application state
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaign | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [pitchText, setPitchText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setCampaigns(getAdminCampaigns());
    setApplications(getCampaignApplications());

    try {
      const sbEvents = await getEventsFromSupabase();
      if (sbEvents && sbEvents.length > 0) {
        const mapped = sbEvents.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          location: e.location,
          date: e.date,
          organizerEmail: e.organizerEmail || "demo-organizer@boothify.id",
        }));
        const filtered = mapped.filter(
          (e) => !e.organizerEmail || e.organizerEmail === user?.email || user?.email === "demo-organizer@boothify.id" || user?.email === "organizer@boothify.id"
        );
        setMyEvents(filtered);
        if (filtered.length > 0) {
          setSelectedEventId((prev) => prev || filtered[0].id);
        }
        return;
      }

      const storedEventsRaw = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const storedList = Array.isArray(storedEventsRaw)
        ? storedEventsRaw.map((e: { id: string; title: string; category?: string; location?: string; date?: string; organizerEmail?: string }) => ({
            id: e.id,
            title: e.title,
            category: e.category || "Umum",
            location: e.location || "Venue Resmi",
            date: e.date || "Terjadwal",
            organizerEmail: e.organizerEmail || user?.email || "demo-organizer@boothify.id",
          }))
        : [];

      const filtered = storedList.filter(
        (e) => !e.organizerEmail || e.organizerEmail === user?.email || user?.email === "demo-organizer@boothify.id"
      );
      setMyEvents(filtered);
      if (filtered.length > 0) {
        setSelectedEventId((prev) => prev || filtered[0].id);
      }
    } catch {
      // ignore
    }
  }, [user?.email]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Applications submitted by this organizer
  const myApplications = applications.filter(
    (a) => a.organizerEmail === user?.email || user?.email === "demo-organizer@boothify.id"
  );

  const selectedEvent = myEvents.find((e) => String(e.id) === String(selectedEventId));

  // Preview alignment score for modal
  const previewAlignment = selectedCampaign && selectedEvent
    ? calculateAlignmentScore(selectedCampaign, {
        category: selectedEvent.category,
        title: selectedEvent.title,
        description: pitchText,
      })
    : null;

  const handleOpenApplyModal = (camp: AdminCampaign) => {
    setSelectedCampaign(camp);

    // Pick first event that has not yet applied to this campaign, or fallback to first event
    const unappliedEvent = myEvents.find(
      (ev) => !applications.some((a) => a.campaignId === camp.id && String(a.eventId) === String(ev.id))
    );
    const targetEvent = unappliedEvent || myEvents[0];

    if (targetEvent) {
      setSelectedEventId(targetEvent.id);
      setPitchText(
        `Pameran ${targetEvent.title} mengusung konsep ${camp.theme} dengan kurasi tenant unggulan, komitmen tertib ramah lingkungan, serta fasilitas transaksi digital yang selaras dengan misi campaign.`
      );
    } else {
      setPitchText("");
    }
  };

  const handleSelectEventChange = (newEvId: string) => {
    setSelectedEventId(newEvId);
    const ev = myEvents.find((e) => String(e.id) === String(newEvId));
    if (ev && selectedCampaign) {
      setPitchText(
        `Pameran ${ev.title} mengusung konsep ${selectedCampaign.theme} dengan kurasi tenant unggulan, komitmen tertib ramah lingkungan, serta fasilitas transaksi digital yang selaras dengan misi campaign.`
      );
    }
  };

  const handleUseTemplatePitch = () => {
    if (!selectedEvent || !selectedCampaign) return;
    setPitchText(
      `Pameran ${selectedEvent.title} mengusung konsep ${selectedCampaign.theme} dengan kurasi tenant unggulan, komitmen tertib ramah lingkungan, serta fasilitas transaksi digital yang selaras dengan misi campaign.`
    );
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!selectedEvent) {
      showNotification("⚠️ Silakan pilih event yang ingin diajukan.");
      return;
    }

    const finalPitch =
      pitchText.trim() ||
      `Pameran ${selectedEvent.title} memiliki keselarasan penuh dengan pilar ${selectedCampaign.theme} dan siap memenuhi standar kurasi resmi.`;

    // Check if event already applied to this campaign
    const existing = applications.find(
      (a) => String(a.eventId) === String(selectedEvent.id) && a.campaignId === selectedCampaign.id
    );
    if (existing) {
      showNotification(
        existing.status === "approved"
          ? "⚠️ Event ini sudah resmi lolos kurasi dalam campaign ini."
          : existing.status === "pending"
          ? "⚠️ Event ini sedang dalam proses peninjauan kurasi admin."
          : "⚠️ Event ini sudah pernah diajukan sebelumnya."
      );
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      submitCampaignApplication({
        campaignId: selectedCampaign.id,
        campaignTitle: selectedCampaign.title,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventCategory: selectedEvent.category || "Umum",
        eventLocation: selectedEvent.location || "Venue Resmi",
        eventDate: selectedEvent.date || "Jadwal Terjadwal",
        organizerEmail: user?.email || "demo-organizer@boothify.id",
        organizerName: user?.businessName || user?.name || "PT. Event Kreasi Nusantara",
        submissionPitch: finalPitch,
      });

      refreshData();
      setSubmitting(false);
      setSelectedCampaign(null);
      showNotification("🚀 Pengajuan berhasil dikirim ke Admin untuk proses kurasi keselarasan!");
    }, 400);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="organizer-campaigns-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-purple-600 text-white shadow-2xl border border-purple-400/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>👑</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-card to-indigo-900/20 border border-purple-500/20 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Program Kurasi Admin
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span>🎁</span> Benefit Bebas Pajak (Free Tax 0%) &amp; Spotlight
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Ikuti Master Campaign Admin Boothify
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Ajukan event Anda untuk dikurasi keselarasan konsepnya oleh Admin. Event yang lolos kurasi otomatis mendapatkan lencana <strong>Official Campaign</strong>, prioritas spotlight di beranda, dan <strong>bebas pajak sewa booth (PPN 0%)</strong> bagi seluruh tenant Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-right">
              <div className="text-[10px] text-muted-foreground font-semibold">Event Lolos Kurasi</div>
              <div className="text-xl font-black text-emerald-400">
                {myApplications.filter((a) => a.status === "approved").length} Event
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Riwayat Pengajuan Saya */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>📋 Status Pengajuan Event Saya</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-normal text-muted-foreground">
              {myApplications.length} Pengajuan
            </span>
          </h2>
        </div>

        {myApplications.length === 0 ? (
          <div className="card-base p-8 text-center border border-white/10 space-y-2">
            <span className="text-2xl">🌱</span>
            <p className="text-sm font-semibold">Belum ada event yang diajukan ke Campaign Admin</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Pilih salah satu campaign aktif di bawah ini dan ajukan event Anda untuk mendapatkan benefit Bebas Pajak dan Highlight.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApplications.map((app) => {
              const isApproved = app.status === "approved";
              const isPending = app.status === "pending";

              return (
                <div
                  key={app.id}
                  className={`card-base p-5 border transition-all ${
                    isApproved
                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                      : isPending
                      ? "border-amber-500/30 bg-amber-500/[0.02]"
                      : "border-red-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : isPending
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-red-500/15 text-red-300 border-red-500/30"
                        }`}
                      >
                        {isApproved
                          ? "✓ Lolos Kurasi (Benefit Aktif)"
                          : isPending
                          ? "⏳ Menunggu Kurasi Admin"
                          : "❌ Belum Disetujui"}
                      </span>
                      <h3 className="text-base font-bold mt-1 text-foreground">{app.eventTitle}</h3>
                      <p className="text-xs text-muted-foreground">
                        Program: <strong className="text-purple-300">{app.campaignTitle}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Skor Keselarasan</span>
                      <span
                        className={`text-lg font-black ${
                          app.alignmentScore >= 80 ? "text-emerald-400" : "text-teal-400"
                        }`}
                      >
                        {app.alignmentScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground bg-white/[0.02] p-2.5 rounded-lg border border-white/5 line-clamp-2 italic mb-3">
                    &ldquo;{app.submissionPitch}&rdquo;
                  </p>

                  {/* Catatan Admin jika ada */}
                  {app.adminNotes && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs mb-3 space-y-1">
                      <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                        <span>💬</span> Catatan Kurator Admin:
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {app.adminNotes}
                      </p>
                    </div>
                  )}

                  {/* Benefit Status */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div>
                      {isApproved ? (
                        <span className="text-emerald-300 font-semibold flex items-center gap-1 text-[11px]">
                          <span>🎁</span> Free Tax Tenant (0%) &amp; Highlight Aktif
                        </span>
                      ) : isPending ? (
                        <span className="text-amber-300 text-[11px]">
                          Sedang ditelaah tim kurasi platform
                        </span>
                      ) : (
                        <span className="text-red-400 text-[11px]">
                          Dapat diajukan kembali setelah penyesuaian konsep
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/events/${app.eventId}`}
                      target="_blank"
                      className="text-primary-light hover:underline text-xs"
                    >
                      Lihat Event ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Daftar Campaign Master Terbuka */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold">Katalog Campaign Master yang Dibuka Admin</h2>
          <p className="text-xs text-muted-foreground">
            Pilih campaign yang selaras dengan tema pameran Anda untuk mendapatkan persetujuan admin dan benefitnya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((camp) => {
            const isJoined = myApplications.some(
              (a) => a.campaignId === camp.id && a.status === "approved"
            );
            const isPending = myApplications.some(
              (a) => a.campaignId === camp.id && a.status === "pending"
            );

            return (
              <div
                key={camp.id}
                className="card-base p-6 border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        {camp.icon}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {camp.status === "active" ? "Terbuka untuk Diajukan" : "Ditutup"}
                        </span>
                        <h3 className="text-lg font-bold text-foreground mt-1">{camp.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-purple-200 font-medium">{camp.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {camp.description}
                  </p>

                  {/* Kriteria Keselarasan Kurasi */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-semibold block">
                      Kriteria Keselarasan yang Dinilai Admin:
                    </span>
                    <ul className="space-y-1 text-[11px] text-foreground/80">
                      {camp.alignmentCriteria.map((crit, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefit Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <span>🎁</span> Benefit Resmi saat Disetujui:
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                        Free Tax (PPN 0%)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {camp.benefits.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    📅 Periode: <strong className="text-foreground">{camp.startDate} – {camp.endDate}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {isJoined && (
                      <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span>✓</span>
                        <span>Tergabung</span>
                      </span>
                    )}
                    {isPending && !isJoined && (
                      <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span>⏳</span>
                        <span>Dalam Kurasi</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenApplyModal(camp)}
                      className="btn btn-primary btn-sm text-xs py-2 px-3.5 shadow-sm bg-purple-600 hover:bg-purple-500 text-white border-none cursor-pointer flex items-center gap-1 font-semibold"
                      id={`apply-camp-${camp.id}`}
                    >
                      <span>{isJoined || isPending ? "+ Ajukan Event Lainnya →" : "Ajukan Event Saya →"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PENGAJUAN EVENT KE CAMPAIGN ADMIN                                   */}
      {/* ========================================================================= */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-lg w-full p-6 relative border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCampaign.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Ajukan Event ke Campaign</h3>
                  <p className="text-xs text-purple-300">{selectedCampaign.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="text-muted-foreground hover:text-foreground text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              {myEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <p className="text-xs text-amber-300 font-semibold">
                    Anda belum memiliki event terdaftar di akun organizer ini.
                  </p>
                  <Link
                    href="/dashboard/organizer/events/new"
                    className="btn btn-primary btn-sm text-xs inline-block"
                  >
                    + Buat Event Pertama
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="select-event" className="block font-semibold mb-1 text-foreground">
                      Pilih Event Milik Anda yang Ingin Diajukan: *
                    </label>
                    <select
                      id="select-event"
                      value={selectedEventId}
                      onChange={(e) => handleSelectEventChange(e.target.value)}
                      className="input-base w-full text-xs"
                      required
                    >
                      {myEvents.map((ev) => {
                        const alreadyApplied = applications.some(
                          (a) => a.campaignId === selectedCampaign.id && String(a.eventId) === String(ev.id)
                        );
                        return (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({ev.category || "Umum"}) {alreadyApplied ? "(Sudah Pernah Diajukan)" : "✓ Siap Diajukan"}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Event yang disetujui akan otomatis mendapatkan benefit Bebas Pajak (Free Tax 0%) untuk tenant.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="submission-pitch" className="block font-semibold text-foreground">
                        Uraian Keselarasan Konsep Event (Pitching ke Admin): *
                      </label>
                      <button
                        type="button"
                        onClick={handleUseTemplatePitch}
                        className="text-[11px] text-purple-300 hover:text-purple-200 underline cursor-pointer"
                      >
                        ✨ Template Otomatis
                      </button>
                    </div>
                    <textarea
                      id="submission-pitch"
                      rows={4}
                      required
                      value={pitchText}
                      onChange={(e) => setPitchText(e.target.value)}
                      placeholder="Jelaskan bagaimana konsep pameran, profil tenant, serta komitmen acara Anda selaras dengan kriteria campaign ini..."
                      className="input-base w-full text-xs leading-relaxed"
                    />
                  </div>

                  {/* Live Preview Skor Keselarasan */}
                  {previewAlignment && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-200">
                          ⚡ Estimasi Skor Keselarasan Awal:
                        </span>
                        <strong
                          className={`text-sm font-black ${
                            previewAlignment.score >= 80 ? "text-emerald-400" : "text-teal-400"
                          }`}
                        >
                          {previewAlignment.score}%
                        </strong>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full"
                          style={{ width: `${previewAlignment.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Skor di atas akan membantu admin menilai kesesuaian kategori, tema, dan kelayakan event Anda.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedCampaign(null)}
                      className="btn btn-ghost btn-sm text-xs py-2 px-4 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-sm text-xs py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white border-none shadow-md cursor-pointer font-bold flex items-center gap-1.5"
                      id="btn-confirm-apply-campaign"
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin text-sm">⏳</span>
                          <span>Mengirim Pengajuan...</span>
                        </>
                      ) : (
                        <span>Kirim Pengajuan ke Admin →</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
