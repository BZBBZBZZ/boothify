"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "../../../../components/Icon";

const TOOLS: Record<string, { title: string; text: string }> = {
  "floor-plan": {
    title: "Floor Plan",
    text: "Silakan buat event terlebih dahulu untuk mengatur denah booth.",
  },
  "ai-campaign": {
    title: "Ide Campaign",
    text: "Silakan buat event terlebih dahulu untuk membuat rekomendasi campaign.",
  },
  "qr-code": {
    title: "QR Code",
    text: "Silakan buat event terlebih dahulu untuk melihat QR code.",
  },
};

/** Shown when an event tool is opened before the organizer has any event. */
export default function NoEventPage() {
  const params = useParams();
  const tool = TOOLS[String(params?.tool || "")] || TOOLS["qr-code"];

  return (
    <div className="animate-fade-in" id="organizer-no-event">
      <h1 className="text-2xl font-bold mb-6">{tool.title}</h1>
      <div className="card-base p-10 text-center max-w-lg">
        <span className="inline-flex mb-4 text-muted-foreground" aria-hidden="true">
          <Icon name="calendar" size={40} />
        </span>
        <h2 className="text-lg font-semibold mb-2">Belum ada event</h2>
        <p className="text-sm text-muted-foreground mb-6">{tool.text}</p>
        <Link href="/dashboard/organizer/events/new" className="btn btn-primary">
          Buat Event
        </Link>
      </div>
    </div>
  );
}
