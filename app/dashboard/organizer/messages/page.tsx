"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthContext";

import {
  listOrganizerMessages,
  setMessageStatus,
  deleteOrganizerMessage,
  errorMessage,
  type InboxMessage as DbMessage,
} from "@/app/lib/db";

type InboxMessage = DbMessage & { time: string };

export default function OrganizerMessagesPage() {
  const { user } = useAuth();
  const organizerId = user?.id || "";
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!organizerId) return;
    let cancelled = false;
    listOrganizerMessages(organizerId)
      .then((list) => {
        if (cancelled) return;
        setMessages(
          list.map((m) => ({
            ...m,
            time: m.createdAt ? new Date(m.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "",
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Pesan gagal dimuat."));
      });
    return () => {
      cancelled = true;
    };
  }, [organizerId]);

  const unreadCount = messages.filter((message) => message.status === "unread").length;
  const visibleMessages = filter === "unread" ? messages.filter((message) => message.status === "unread") : messages;

  const markAsRead = async (id: string) => {
    const previous = messages;
    setMessages(messages.map((message) => (message.id === id ? { ...message, status: "read" } : message)));
    try {
      await setMessageStatus(id, "read");
    } catch (err) {
      setMessages(previous);
      setLoadError(errorMessage(err, "Pesan gagal diperbarui."));
    }
  };

  const deleteMessage = async (id: string) => {
    const previous = messages;
    setMessages(messages.filter((message) => message.id !== id));
    try {
      await deleteOrganizerMessage(id);
    } catch (err) {
      setMessages(previous);
      setLoadError(errorMessage(err, "Pesan gagal dihapus."));
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl" id="organizer-messages">
      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-sm text-error" role="alert">{loadError}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 pb-6 border-b border-border">
        <div>
          <Link href="/dashboard/organizer" className="text-xs text-muted-foreground hover:text-primary-light transition inline-flex items-center gap-2 mb-4">
            Kembali ke dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pesan masuk</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">Kelola pertanyaan tenant dan pengunjung dari satu tempat.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-lg">Percakapan terbaru</h2>
          <p className="text-xs text-muted-foreground mt-1">Balas melalui WhatsApp atau email sesuai kebutuhan.</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Filter pesan">
          <button type="button" onClick={() => setFilter("all")} className={`btn btn-sm min-h-11 ${filter === "all" ? "btn-primary" : "btn-secondary"}`}>Semua ({messages.length})</button>
          <button type="button" onClick={() => setFilter("unread")} className={`btn btn-sm min-h-11 ${filter === "unread" ? "btn-primary" : "btn-secondary"}`}>Belum dibaca ({unreadCount})</button>
        </div>
      </div>

      {visibleMessages.length === 0 ? (
        <div className="card-base p-10 text-center border-dashed">
          <h2 className="font-semibold text-base">Tidak ada pesan</h2>
          <p className="text-sm text-muted-foreground mt-2">{filter === "unread" ? "Semua pesan telah dibaca." : "Pesan dari tenant atau pengunjung akan muncul di sini."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((message) => (
            <article key={message.id} className={`card-base p-5 border transition-colors ${message.status === "unread" ? "border-primary/40 bg-primary/[0.04]" : "border-border"}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <h3 className="font-semibold text-sm">{message.senderName}</h3>
                    {message.status === "unread" && <span className="badge badge-accent text-[10px]">Baru</span>}
                    <span className="text-xs text-muted-foreground">{message.senderEmail}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span className="badge badge-secondary text-[10px]">{message.eventTitle}</span>
                    <span>{message.time}</span>
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">{message.message}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 lg:max-w-[260px] lg:justify-end">
                  {message.senderPhone && <a href={`https://wa.me/${message.senderPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm min-h-11 text-xs text-emerald-700">WhatsApp</a>}
                  <a href={`mailto:${message.senderEmail}?subject=Re: Pertanyaan Event ${encodeURIComponent(message.eventTitle)}`} className="btn btn-secondary btn-sm min-h-11 text-xs">Email</a>
                  {message.status === "unread" && <button type="button" onClick={() => markAsRead(message.id)} className="btn btn-ghost btn-sm min-h-11 text-xs text-primary-light">Tandai dibaca</button>}
                  <button type="button" onClick={() => deleteMessage(message.id)} className="btn btn-ghost btn-sm min-h-11 text-xs text-error">Hapus</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
