"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthContext";

import {
  getOrganizerMessagesFromSupabase,
  updateOrganizerMessageStatusInSupabase,
  deleteOrganizerMessageInSupabase,
} from "@/app/lib/supabase-service";

type InboxMessage = {
  id: string;
  eventId?: string;
  eventTitle: string;
  organizerEmail?: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  time: string;
  status: "unread" | "read" | "replied";
};

export default function OrganizerMessagesPage() {
  const { user } = useAuth();
  const email = user?.email || "demo-organizer@boothify.id";
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    async function loadMessages() {
      const sbMsgs = await getOrganizerMessagesFromSupabase();
      if (sbMsgs && sbMsgs.length > 0) {
        setMessages(
          sbMsgs.map((m) => ({
            id: m.id,
            eventId: m.eventId,
            eventTitle: m.eventTitle || "Event Boothify",
            organizerEmail: m.organizerEmail,
            senderName: m.senderName,
            senderEmail: m.senderEmail,
            senderPhone: m.senderPhone,
            message: m.message,
            time: m.createdAt ? new Date(m.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Baru saja",
            status: (m.status as "unread" | "read" | "replied") || "unread",
          }))
        );
        return;
      }

      try {
        const storedInbox = JSON.parse(localStorage.getItem("boothify_organizer_inbox") || "[]");
        if (Array.isArray(storedInbox) && storedInbox.length > 0) {
          setMessages(storedInbox);
        }
      } catch {
        // ignore
      }
    }

    loadMessages();
  }, [email]);

  const unreadCount = messages.filter((message) => message.status === "unread").length;
  const visibleMessages = filter === "unread" ? messages.filter((message) => message.status === "unread") : messages;

  const updateMessages = (nextMessages: InboxMessage[]) => {
    setMessages(nextMessages);
    localStorage.setItem("boothify_organizer_inbox", JSON.stringify(nextMessages));
  };

  const markAsRead = (id: string) => {
    updateMessages(messages.map((message) => (message.id === id ? { ...message, status: "read" } : message)));
    updateOrganizerMessageStatusInSupabase(id, "read");
  };

  const deleteMessage = (id: string) => {
    updateMessages(messages.filter((message) => message.id !== id));
    deleteOrganizerMessageInSupabase(id);
  };

  return (
    <div className="animate-fade-in max-w-5xl" id="organizer-messages">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 pb-6 border-b border-border">
        <div>
          <Link href="/dashboard/organizer" className="text-xs text-muted-foreground hover:text-primary-light transition inline-flex items-center gap-2 mb-4">
            <span aria-hidden="true">←</span> Kembali ke dashboard
          </Link>
          <p className="text-xs uppercase tracking-[0.12em] text-primary-light font-semibold mb-2">Communication</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pesan masuk</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">Kelola pertanyaan tenant dan pengunjung dari satu tempat.</p>
        </div>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <div className="px-3 py-2 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground">Total </span><strong>{messages.length}</strong>
          </div>
          <div className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <span>Belum dibaca </span><strong>{unreadCount}</strong>
          </div>
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
                  {message.senderPhone && <a href={`https://wa.me/${message.senderPhone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm min-h-11 text-xs text-emerald-300">WhatsApp</a>}
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
