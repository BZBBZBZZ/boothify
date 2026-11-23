"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, Tabs } from "@/app/components/ui";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import {
  AdminCampaign,
  CampaignApplication,
  calculateAlignmentScore,
} from "@/app/lib/admin-campaigns";
import { listCampaigns, listApplications, listOrganizerEvents, submitApplication, errorMessage } from "@/app/lib/db";
import Icon from "../../../components/Icon";
import FreshOnNavigate from "../../../components/FreshOnNavigate";

function OrganizerCampaignsPageContent() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [myEvents, setMyEvents] = useState<Array<{ id: string; title: string; category?: string; location?: string; date?: string; description?: string }>>([]);

  // Modal application state
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaign | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [pitchText, setPitchText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"catalog" | "mine">("catalog");

  const [loadError, setLoadError] = useState("");

  const organizerId = user?.id || "";
  const refreshData = useCallback(async () => {
    if (!organizerId) return;
    try {
      const [camps, apps, own] = await Promise.all([listCampaigns(), listApplications(), listOrganizerEvents(organizerId)]);
      setCampaigns(camps);
      setApplications(apps);
      // Only published events can join a campaign
      const published = own
        .filter((e) => e.status === "published")
        .map((e) => ({ id: e.id, title: e.title, category: e.category, location: e.location, date: e.date, description: e.description }));
      setMyEvents(published);
      setSelectedEventId((prev) => (prev && published.some((e) => e.id === prev) ? prev : published[0]?.id || ""));
    } catch (err) {
      setLoadError(errorMessage(err, "Data campaign gagal dimuat."));
    }
  }, [organizerId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Applications submitted for this organizer's events
  const myEventIds = new Set(myEvents.map((e) => e.id));
  const myApplications = applications.filter(
    (a) => a.organizerEmail === user?.email || myEventIds.has(a.eventId)
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

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!selectedEvent) {
      showNotification("Silakan pilih event yang ingin diajukan.");
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
          ? "Event ini sudah resmi lolos kurasi dalam campaign ini."
          : existing.status === "pending"
          ? "Event ini sedang dalam proses peninjauan kurasi admin."
          : "Event ini sudah pernah diajukan sebelumnya."
      );
      return;
    }

    setSubmitting(true);
    const { score, breakdown } = calculateAlignmentScore(selectedCampaign, {
      category: selectedEvent.category,
      title: selectedEvent.title,
      description: `${selectedEvent.description || ""} ${finalPitch}`,
    });
    try {
      await submitApplication({
        campaignId: selectedCampaign.id,
        campaignTitle: selectedCampaign.title,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventCategory: selectedEvent.category || "Umum",
        eventLocation: selectedEvent.location || "",
        eventDate: selectedEvent.date || "",
        organizerEmail: user?.email || "",
        organizerName: user?.businessName || user?.name || "",
        submissionPitch: finalPitch,
        alignmentScore: score,
        alignmentBreakdown: breakdown,
      });
      await refreshData();
      setSelectedCampaign(null);
      showNotification("Pengajuan berhasil dikirim ke Admin untuk proses kurasi.");
    } catch (err) {
      showNotification(errorMessage(err, "Pengajuan gagal dikirim."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="organizer-campaigns-page">
      {loadError && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-sm text-error" role="alert">{loadError}</div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="page-toast" role="status">
          <span><Icon name="shield" size={16} /></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Program campaign Boothify"
        description={<>Ajukan event kamu ke campaign yang dibuka admin. Event yang lolos kurasi mendapat lencana partner resmi, tampil di beranda, dan tenant-nya <strong>bebas pajak sewa booth (PPN 0%)</strong>.</>}
        actions={
          <span className="badge badge-secondary">
            {myApplications.filter((a) => a.status === "approved").length} event lolos kurasi
          </span>
        }
      />

      <Tabs<"catalog" | "mine">
        label="Bagian campaign"
        idPrefix="campaign"
        active={tab}
        onChange={setTab}
        items={[
          { key: "catalog", label: "Campaign tersedia", count: campaigns.length },
          { key: "mine", label: "Pengajuan saya", count: myApplications.length },
        ]}
      />

      {/* Section 1: Riwayat Pengajuan Saya */}
      {tab === "mine" && (
      <div className="space-y-4 animate-fade-in" role="tabpanel" id="campaign-panel-mine" aria-labelledby="campaign-mine">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Status pengajuan event</h2>
        </div>

        {myApplications.length === 0 ? (
          <div className="card-base p-8 text-center border border-border space-y-2">
            <span className="text-2xl"><Icon name="leaf" size={24} /></span>
            <p className="text-sm font-semibold">Belum ada event yang diajukan</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Buka tab Campaign tersedia, pilih campaign, lalu ajukan event kamu.
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
                  className={`card-base p-5 border transition-colors ${
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
                        className={`text-xs font-bold px-2 py-0.5 border ${
                          isApproved
                            ? "bg-emerald-500/15 text-success border-emerald-500/30"
                            : isPending
                            ? "bg-amber-500/15 text-primary-light border-amber-500/30"
                            : "bg-red-500/15 text-error border-red-500/30"
                        }`}
                      >
                        {isApproved
                          ? "Lolos Kurasi (Benefit Aktif)"
                          : isPending
                          ? "Menunggu Kurasi Admin"
                          : "Belum Disetujui"}
                      </span>
                      <h3 className="text-base font-bold mt-1 text-foreground">{app.eventTitle}</h3>
                      <p className="text-xs text-muted-foreground">
                        Program: <strong className="text-info">{app.campaignTitle}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Skor Keselarasan</span>
                      <span
                        className={`text-lg font-semibold ${
                          app.alignmentScore >= 80 ? "text-success" : "text-success"
                        }`}
                      >
                        {app.alignmentScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground bg-foreground/[0.03] p-2.5 rounded-lg border border-border line-clamp-2 italic mb-3">
                    &ldquo;{app.submissionPitch}&rdquo;
                  </p>

                  {/* Catatan Admin jika ada */}
                  {app.adminNotes && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs mb-3 space-y-1">
                      <div className="font-semibold text-info flex items-center gap-1.5">
                        <span><Icon name="message" size={16} /></span> Catatan Kurator Admin:
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {app.adminNotes}
                      </p>
                    </div>
                  )}

                  {/* Benefit Status */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <div>
                      {isApproved ? (
                        <span className="text-success font-semibold flex items-center gap-1 text-[11px]">
                          <span><Icon name="gift" size={16} /></span> Bebas pajak tenant (PPN 0%) &amp; sorotan aktif
                        </span>
                      ) : isPending ? (
                        <span className="text-primary-light text-[11px]">
                          Sedang ditelaah tim kurasi platform
                        </span>
                      ) : (
                        <span className="text-error text-[11px]">
                          Dapat diajukan kembali setelah penyesuaian konsep
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/events/${app.eventId}`}
                      target="_blank"
                      className="text-primary-light hover:underline text-xs"
                    >
                      Lihat Event
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      )}

      {/* Section 2: Daftar Campaign Master Terbuka */}
      {tab === "catalog" && (
      <div className="space-y-4 animate-fade-in" role="tabpanel" id="campaign-panel-catalog" aria-labelledby="campaign-catalog">
        <div>
          <h2 className="section-title">Campaign yang dibuka admin</h2>
          <p className="text-xs text-muted-foreground">
            Pilih campaign yang sesuai dengan tema event kamu, lalu ajukan event.
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
                      <span className="p-2 rounded-lg bg-foreground text-background flex-shrink-0" aria-hidden="true">
                        <Icon name="star" size={24} />
                      </span>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-success border border-emerald-500/30">
                          {camp.status === "active" ? "Terbuka untuk Diajukan" : "Ditutup"}
                        </span>
                        <h3 className="text-lg font-bold text-foreground mt-1">{camp.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-info font-medium">{camp.tagline}</p>
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
                          <span className="text-info font-bold">•</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefit Banner */}
                  <div className="p-3.5 rounded-xl bg-success/10 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-success">
                      <span className="flex items-center gap-1.5">
                        <span><Icon name="gift" size={16} /></span> Benefit Resmi saat Disetujui:
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                        Bebas pajak (PPN 0%)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {camp.benefits.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Periode: <strong className="text-foreground">{camp.startDate} – {camp.endDate}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {isJoined && (
                      <span className="text-[11px] font-semibold text-success bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span><Icon name="check" size={16} /></span>
                        <span>Tergabung</span>
                      </span>
                    )}
                    {isPending && !isJoined && (
                      <span className="text-[11px] font-semibold text-primary-light bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span><Icon name="clock" size={16} /></span>
                        <span>Dalam Kurasi</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenApplyModal(camp)}
                      className="btn btn-primary btn-sm"
                      id={`apply-camp-${camp.id}`}
                    >
                      <span>{isJoined || isPending ? "+ Ajukan event lain" : "Ajukan event"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      )}

      {/* ========================================================================= */}
      {/* MODAL PENGAJUAN EVENT KE CAMPAIGN ADMIN                                   */}
      {/* ========================================================================= */}
      {selectedCampaign && (
        <div className="modal-overlay">
          <div className="card-base max-w-lg w-full p-6 relative border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-foreground text-background flex-shrink-0" aria-hidden="true"><Icon name="star" size={20} /></span>
                <div>
                  <h3 className="section-title">Ajukan event ke campaign</h3>
                  <p className="text-xs text-info">{selectedCampaign.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="text-muted-foreground hover:text-foreground text-lg cursor-pointer"
              aria-label="Tutup"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              {myEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <p className="text-xs text-primary-light font-semibold">
                    Kamu belum memiliki event terdaftar di akun organizer ini.
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
                    <label htmlFor="select-event" className="field-label">
                      Event yang diajukan *
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
                            {ev.title} ({ev.category || "Umum"}) {alreadyApplied ? "(Sudah Pernah Diajukan)" : "Siap Diajukan"}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Event yang disetujui akan otomatis mendapatkan benefit Bebas pajak (PPN 0%) untuk tenant.
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
                        className="text-[11px] text-info hover:text-info underline cursor-pointer"
                      >
                        Template Otomatis
                      </button>
                    </div>
                    <textarea
                      id="submission-pitch"
                      rows={4}
                      required
                      value={pitchText}
                      onChange={(e) => setPitchText(e.target.value)}
                      placeholder="Jelaskan bagaimana konsep pameran, profil tenant, serta komitmen acara kamu selaras dengan kriteria campaign ini..."
                      className="input-base w-full text-xs leading-relaxed"
                    />
                  </div>

                  {/* Live Preview Skor Keselarasan */}
                  {previewAlignment && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-info">
                          Estimasi Skor Keselarasan Awal:
                        </span>
                        <strong
                          className={`text-sm font-semibold ${
                            previewAlignment.score >= 80 ? "text-success" : "text-success"
                          }`}
                        >
                          {previewAlignment.score}%
                        </strong>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-info/10 rounded-full"
                          style={{ width: `${previewAlignment.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Skor di atas akan membantu admin menilai kesesuaian kategori, tema, dan kelayakan event kamu.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                      id="btn-confirm-apply-campaign"
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin keep-motion" aria-hidden="true" />
                          <span>Mengirim Pengajuan...</span>
                        </>
                      ) : (
                        <span>Kirim Pengajuan ke Admin</span>
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

export default function OrganizerCampaignsPage() {
  return (
    <FreshOnNavigate>
      <OrganizerCampaignsPageContent />
    </FreshOnNavigate>
  );
}
