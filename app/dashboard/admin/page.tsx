"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminCampaign,
  CampaignApplication,
  getAdminCampaigns,
  getCampaignApplications,
  createAdminCampaign,
  updateAdminCampaign,
  reviewCampaignApplication,
} from "@/app/lib/admin-campaigns";

export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [activeTab, setActiveTab] = useState<"curation" | "campaigns" | "create">("curation");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for creating a new campaign
  const [newTitle, setNewTitle] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newIcon, setNewIcon] = useState("✨");
  const [newCategories, setNewCategories] = useState<string[]>(["Fashion", "Kuliner"]);
  const [newCriteria, setNewCriteria] = useState<string>("");

  const refreshData = () => {
    setCampaigns(getAdminCampaigns());
    setApplications(getCampaignApplications());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stats calculation
  const totalCampaigns = campaigns.filter((c) => c.status === "active").length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const approvedApps = applications.filter((a) => a.status === "approved").length;
  const filteredApps = applications.filter((a) => {
    if (selectedFilter === "all") return true;
    return a.status === selectedFilter;
  });

  const handleReview = (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    const note = reviewNotes[id] || (status === "approved" ? "Konsep terverifikasi selaras dengan misi campaign. Disetujui masuk campaign dengan benefit Free Tax dan Highlight." : "Konsep pameran belum memenuhi kriteria keselarasan tema campaign.");

    setTimeout(() => {
      reviewCampaignApplication(id, status, note);
      refreshData();
      setProcessingId(null);
      showNotification(
        status === "approved"
          ? "✅ Event berhasil disetujui! Status Highlight dan Bebas Pajak (Free Tax 0%) kini aktif untuk tenant."
          : "ℹ️ Pengajuan event telah ditolak dengan catatan evaluasi."
      );
    }, 400);
  };

  const handleToggleCampaignStatus = (id: string, currentStatus: "active" | "draft" | "closed") => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    updateAdminCampaign(id, { status: nextStatus });
    refreshData();
    showNotification(`Status campaign diperbarui menjadi ${nextStatus.toUpperCase()}`);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const criteriaList = newCriteria
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    createAdminCampaign({
      title: newTitle.trim(),
      tagline: newTagline.trim() || "Program Kurasi Khusus Boothify",
      description: newDescription.trim(),
      theme: newTheme.trim() || "Ekonomi Kreatif & Standar Unggulan",
      targetCategories: newCategories,
      alignmentCriteria: criteriaList.length > 0 ? criteriaList : [
        "Kurasi produk berkualitas dan memiliki izin edar/standar jelas",
        "Komitmen penyelenggaraan tertib dan ramah pengunjung",
        "Fasilitas transaksi terintegrasi digital",
      ],
      startDate: newStartDate || "Segera Dimulai",
      endDate: newEndDate || "Hingga Kuota Terpenuhi",
      status: "active",
      bannerGradient: "from-purple-500/20 via-primary/20 to-indigo-500/20",
      icon: newIcon || "🎯",
      benefits: {
        freeTax: true,
        highlightBadge: "🌟 Official Admin Campaign",
        priorityListing: true,
        description: "Bebas Pajak (PPN 0%) transaksi sewa booth tenant dan pin sorotan prioritas pada halaman Jelajahi Event.",
      },
      maxParticipants: 10,
    });

    // Reset form
    setNewTitle("");
    setNewTagline("");
    setNewTheme("");
    setNewDescription("");
    setNewStartDate("");
    setNewEndDate("");
    setNewCriteria("");
    refreshData();
    setActiveTab("campaigns");
    showNotification("🎉 Campaign Master baru berhasil dibuat dan siap diikuti oleh para organizer!");
  };

  const toggleCategory = (cat: string) => {
    setNewCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-dashboard-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-purple-600 text-white shadow-2xl border border-purple-400/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>👑</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-card to-indigo-950/40 border border-purple-500/30 relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Pusat Otoritas Platform
              </span>
              <span className="text-xs text-muted-foreground">Admin di atas Organizer</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Manajemen Master Campaign &amp; Kurasi Penyelarasan Event
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Buat campaign induk untuk diikuti event organizer, kurasi keselarasan nilai pameran, dan berikan benefit otomatis berupa <strong>Bebas Pajak (Free Tax 0%)</strong> bagi tenant serta <strong>Highlight Prioritas</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className="btn btn-primary btn-sm text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md bg-purple-600 hover:bg-purple-500 border-none text-white"
              id="admin-create-campaign-btn"
            >
              <span>➕</span>
              <span>Buat Campaign Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-4 border border-purple-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Campaign Aktif</span>
            <span className="text-base">🎯</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{totalCampaigns}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Program induk siap diikuti</p>
        </div>

        <div className="card-base p-4 border border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Butuh Kurasi</span>
            <span className="text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingApps}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Pengajuan organizer pending</p>
        </div>

        <div className="card-base p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Event Tergabung</span>
            <span className="text-base">✅</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{approvedApps}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Lolos kurasi keselarasan</p>
        </div>

        <div className="card-base p-4 border border-teal-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Benefit Free Tax</span>
            <span className="text-base">🎁</span>
          </div>
          <div className="text-2xl font-black text-teal-300">0% PPN</div>
          <p className="text-[11px] text-muted-foreground mt-1">Aktif untuk tenant pameran</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-border/80 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("curation")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "curation"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-curation"
        >
          <span>⚖️ Kurasi Keselarasan Pengajuan</span>
          {pendingApps > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {pendingApps}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "campaigns"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-campaigns"
        >
          <span>🎯 Daftar Master Campaign ({campaigns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "create"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-create"
        >
          <span>➕ Buat Campaign Baru</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KURASI KESELARASAN PENGAJUAN ORGANIZER                              */}
      {/* ========================================================================= */}
      {activeTab === "curation" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Penelaahan &amp; Kurasi Pengajuan Organizer</h2>
              <p className="text-xs text-muted-foreground">
                Periksa keselarasan konsep pameran organizer dengan kriteria campaign sebelum memberikan persetujuan.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
              {[
                { id: "pending", label: "Menunggu Kurasi", count: pendingApps },
                { id: "approved", label: "Disetujui", count: approvedApps },
                { id: "rejected", label: "Ditolak", count: applications.filter((a) => a.status === "rejected").length },
                { id: "all", label: "Semua", count: applications.length },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
                  className={`text-[11px] font-medium py-1 px-2.5 rounded-lg transition ${
                    selectedFilter === f.id
                      ? "bg-purple-600 text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="card-base p-12 text-center border border-white/10 space-y-3">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-semibold">Tidak ada pengajuan pada filter ini</p>
              <p className="text-xs text-muted-foreground">
                Semua pengajuan organizer untuk kategori ini sudah diproses atau belum ada yang diajukan.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredApps.map((app) => {
                const targetCampaign = campaigns.find((c) => c.id === app.campaignId);
                const isPending = app.status === "pending";
                const isApproved = app.status === "approved";
                const noteVal = reviewNotes[app.id] ?? (app.adminNotes || "");

                return (
                  <div
                    key={app.id}
                    className={`card-base p-5 border transition-all ${
                      isPending
                        ? "border-amber-500/40 bg-gradient-to-br from-amber-500/[0.03] to-transparent shadow-md"
                        : isApproved
                        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.02] to-transparent"
                        : "border-red-500/20 bg-white/[0.01]"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              isPending
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : isApproved
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-red-500/15 text-red-300 border-red-500/30"
                            }`}
                          >
                            {isPending ? "⏳ Menunggu Kurasi Admin" : isApproved ? "✅ Terverifikasi Masuk Campaign" : "❌ Ditolak"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Target Campaign: <strong>{app.campaignTitle}</strong>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <span>{app.eventTitle}</span>
                          <span className="badge badge-primary text-[10px]">{app.eventCategory}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Diajukan oleh: <strong className="text-foreground">{app.organizerName}</strong> ({app.organizerEmail}) • 📅 {app.eventDate} • 📍 {app.eventLocation}
                        </p>
                      </div>

                      {/* Skor keselarasan badge */}
                      <div className="flex items-center gap-3 self-start md:self-auto p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground font-semibold">Skor Keselarasan</div>
                          <div
                            className={`text-xl font-black ${
                              app.alignmentScore >= 80
                                ? "text-emerald-400"
                                : app.alignmentScore >= 60
                                ? "text-teal-400"
                                : "text-amber-400"
                            }`}
                          >
                            {app.alignmentScore}%
                          </div>
                        </div>
                        <span className="text-2xl">
                          {app.alignmentScore >= 80 ? "✨" : app.alignmentScore >= 60 ? "🎯" : "⚠️"}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown keselarasan & submission pitch */}
                    <div className="py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left: Uraian pitch keselarasan organizer */}
                      <div className="lg:col-span-2 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                            <span>📝 Uraian Keselarasan Konsep (Pitch Organizer):</span>
                          </h4>
                          <p className="text-xs text-foreground/90 bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed italic">
                            &ldquo;{app.submissionPitch}&rdquo;
                          </p>
                        </div>

                        {/* Kriteria Keselarasan dari Campaign Admin */}
                        {targetCampaign && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
                              Kriteria Campaign yang Diharapkan Admin:
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {targetCampaign.alignmentCriteria.map((crit, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200"
                                >
                                  • {crit}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Rincian pilar keselarasan otomatis */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs">
                        <h4 className="font-semibold text-foreground flex items-center justify-between">
                          <span>Evaluasi Parameter:</span>
                          <span className="text-[10px] text-muted-foreground">Automated Analysis</span>
                        </h4>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Kesesuaian Kategori:</span>
                            <span className="font-bold text-emerald-400">
                              {app.alignmentBreakdown?.categoryMatch || 90}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${app.alignmentBreakdown?.categoryMatch || 90}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Keselarasan Tema &amp; Nilai:</span>
                            <span className="font-bold text-teal-400">
                              {app.alignmentBreakdown?.themeMatch || 85}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${app.alignmentBreakdown?.themeMatch || 85}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Skala &amp; Kesiapan Pameran:</span>
                            <span className="font-bold text-purple-400">
                              {app.alignmentBreakdown?.scaleMatch || 85}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${app.alignmentBreakdown?.scaleMatch || 85}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 text-[11px] text-muted-foreground">
                          {isApproved ? (
                            <span className="text-emerald-300 flex items-center gap-1 font-medium">
                              <span>🎁</span> Benefit aktif: Free Tax tenant &amp; status Highlight katalog publik.
                            </span>
                          ) : (
                            <span>Persetujuan admin akan otomatis mengaktifkan benefit Free Tax dan Highlight.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions Bar */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div>
                        <label htmlFor={`notes-${app.id}`} className="block text-xs font-medium text-muted-foreground mb-1">
                          Catatan Evaluasi Kurator Admin:
                        </label>
                        <input
                          id={`notes-${app.id}`}
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          placeholder="Masukkan catatan penilaian keselarasan atau alasan persetujuan..."
                          className="input-base text-xs w-full py-2"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-muted-foreground">
                          ID Pengajuan: <code className="text-purple-300">{app.id}</code>
                          {app.reviewedAt && ` • Dikurasi pada: ${new Date(app.reviewedAt).toLocaleDateString("id-ID")}`}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${app.eventId}`}
                            target="_blank"
                            className="btn btn-secondary btn-sm text-xs py-1.5 px-3"
                          >
                            Lihat Halaman Event ↗
                          </Link>

                          {isPending ? (
                            <>
                              <button
                                type="button"
                                disabled={processingId === app.id}
                                onClick={() => handleReview(app.id, "rejected")}
                                className="btn btn-ghost btn-sm text-xs py-1.5 px-3 text-red-400 hover:bg-red-500/10 cursor-pointer"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                disabled={processingId === app.id}
                                onClick={() => handleReview(app.id, "approved")}
                                className="btn btn-primary btn-sm text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-sm cursor-pointer"
                              >
                                {processingId === app.id ? "Memproses..." : "✓ Setujui & Berikan Benefit"}
                              </button>
                            </>
                          ) : isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleReview(app.id, "rejected")}
                              className="text-xs text-muted-foreground hover:text-red-400 underline transition cursor-pointer"
                            >
                              Cabut Persetujuan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReview(app.id, "approved")}
                              className="btn btn-secondary btn-sm text-xs py-1.5 px-3 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                            >
                              Tinjau Ulang &amp; Setujui
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAFTAR CAMPAIGN MASTER YANG ADA                                    */}
      {/* ========================================================================= */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Daftar Master Campaign Resmi Boothify</h2>
              <p className="text-xs text-muted-foreground">
                Campaign ini dapat dilihat dan diikuti oleh para organizer melalui dashboard mereka.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className="btn btn-primary btn-sm text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white border-none"
            >
              ➕ Buat Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((camp) => {
              const joinedCount = applications.filter(
                (a) => a.campaignId === camp.id && a.status === "approved"
              ).length;

              return (
                <div
                  key={camp.id}
                  className="card-base p-5 border border-purple-500/20 space-y-4 hover:border-purple-500/40 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          {camp.icon}
                        </span>
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              camp.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-white/5 text-muted-foreground border-white/10"
                            }`}
                          >
                            {camp.status === "active" ? "Aktif Berjalan" : "Ditutup"}
                          </span>
                          <h3 className="text-base font-bold mt-1 text-foreground">{camp.title}</h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-purple-200/90 font-medium">{camp.tagline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {camp.description}
                    </p>

                    {/* Target Categories */}
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1 font-semibold">
                        Target Industri:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {camp.targetCategories.map((cat, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Standard Benefit Banner */}
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                        <span className="flex items-center gap-1.5">
                          <span>🎁</span> Benefit Resmi Campaign
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Free Tax 0%
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {camp.benefits.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="text-muted-foreground">
                      <span>👥 Event Tergabung: </span>
                      <strong className="text-emerald-400 font-bold">{joinedCount}</strong>
                      {camp.maxParticipants && ` / max ${camp.maxParticipants}`}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp.id, camp.status)}
                        className="btn btn-secondary btn-sm text-xs py-1 px-2.5"
                      >
                        {camp.status === "active" ? "Tutup Campaign" : "Aktifkan"}
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
      {/* TAB 3: BUAT MASTER CAMPAIGN BARU OLEH ADMIN                                */}
      {/* ========================================================================= */}
      {activeTab === "create" && (
        <div className="max-w-3xl mx-auto card-base p-6 sm:p-8 border border-purple-500/30 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold mb-1">
              <span>👑 Form Pembuatan Program Induk</span>
            </div>
            <h2 className="text-lg font-bold">Buat Master Campaign untuk Organizer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Campaign yang Anda buat akan langsung tampil di dashboard seluruh organizer untuk diajukan.
            </p>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
            <div>
              <label htmlFor="camp-title" className="block font-semibold mb-1 text-foreground">
                Judul Campaign Master *
              </label>
              <input
                id="camp-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Festival Belanja Kreatif Nasional 2026"
                className="input-base w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="camp-tagline" className="block font-semibold mb-1 text-foreground">
                  Tagline Ringkas
                </label>
                <input
                  id="camp-tagline"
                  type="text"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  placeholder="Contoh: Pesta Kreatif & Karya Artisan Anak Bangsa"
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label htmlFor="camp-theme" className="block font-semibold mb-1 text-foreground">
                  Pilar / Tema Pokok
                </label>
                <input
                  id="camp-theme"
                  type="text"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  placeholder="Contoh: Keberlanjutan & Industri Kreatif"
                  className="input-base w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="camp-desc" className="block font-semibold mb-1 text-foreground">
                Deskripsi Lengkap Misi Campaign *
              </label>
              <textarea
                id="camp-desc"
                rows={3}
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Jelaskan tujuan campaign, target pencapaian pameran, dan ekspektasi kurasi..."
                className="input-base w-full text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                Pilih Target Kategori Industri:
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Fashion", "Kuliner", "Kriya", "Teknologi", "Gaya Hidup", "Edukasi", "Multi-Industri"].map((cat) => {
                  const selected = newCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs py-1.5 px-3 rounded-lg border transition cursor-pointer ${
                        selected
                          ? "bg-purple-600 border-purple-500 text-white font-semibold"
                          : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="camp-criteria" className="block font-semibold mb-1 text-foreground">
                Kriteria Keselarasan Kurasi (1 baris per kriteria):
              </label>
              <textarea
                id="camp-criteria"
                rows={3}
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder="Contoh:&#10;Mengutamakan produk lokal & karya desainer mandiri&#10;Memiliki komitmen bebas plastik sekali pakai&#10;Fasilitas transaksi QRIS terintegrasi"
                className="input-base w-full text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="camp-start" className="block font-semibold mb-1 text-foreground">
                  Tanggal Mulai
                </label>
                <input
                  id="camp-start"
                  type="text"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  placeholder="01 Nov 2026"
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label htmlFor="camp-end" className="block font-semibold mb-1 text-foreground">
                  Tanggal Selesai
                </label>
                <input
                  id="camp-end"
                  type="text"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  placeholder="31 Des 2026"
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label htmlFor="camp-icon" className="block font-semibold mb-1 text-foreground">
                  Ikon Emoji
                </label>
                <input
                  id="camp-icon"
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="✨"
                  className="input-base w-full text-xs text-center"
                />
              </div>
            </div>

            {/* Standard Benefits Notice */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-200">
                <span>🎁</span>
                <span>Benefit Standar Otomatis untuk Seluruh Event Tergabung:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>
                  <strong className="text-emerald-400">Free Tax (Pajak 0%)</strong>: Otomatis membebaskan pajak/PPN saat tenant checkout menyewa booth.
                </li>
                <li>
                  <strong className="text-purple-300">Highlight Prioritas</strong>: Event organizer berhak atas lencana <em>Official Admin Campaign</em> dan sorotan utama di halaman Jelajahi Event.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("campaigns")}
                className="btn btn-ghost btn-sm text-xs py-2 px-4"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm text-xs py-2 px-5 bg-purple-600 hover:bg-purple-500 text-white border-none shadow-md"
                id="btn-submit-new-campaign"
              >
                🚀 Luncurkan Campaign Master
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
