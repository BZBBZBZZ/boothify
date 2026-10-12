"use client";

import Link from "next/link";
import { useState } from "react";

const EVENTS = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", location: "Jakarta Convention Center", category: "Fashion", price: "Rp 2.5Jt", match: "95%", booths: 18, image: "🌿" },
  { id: "2", title: "Indonesia Food Festival", date: "22–24 Nov 2026", location: "ICE BSD", category: "F&B", price: "Rp 3Jt", match: "72%", booths: 35, image: "🍜" },
  { id: "3", title: "EduTech Innovation Fair", date: "1–3 Des 2026", location: "Surabaya Grand City", category: "Education", price: "Rp 1.8Jt", match: "92%", booths: 22, image: "📚" },
  { id: "4", title: "AutoMotive Show 2026", date: "10–12 Des 2026", location: "JIEXPO Kemayoran", category: "Automotive", price: "Rp 5Jt", match: "45%", booths: 15, image: "🚗" },
  { id: "5", title: "Craft & Artisan Market", date: "18–20 Des 2026", location: "Bandung Creative Hub", category: "Craft", price: "Rp 1.2Jt", match: "88%", booths: 15, image: "🎨" },
  { id: "6", title: "Sustainable Living Expo", date: "5–7 Jan 2027", location: "Bali BNDCC", category: "Fashion", price: "Rp 4Jt", match: "87%", booths: 22, image: "🌱" },
];

export default function TenantEventsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("match");

  const filtered = EVENTS.filter(
    (e) => e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => sortBy === "match" ? parseInt(b.match) - parseInt(a.match) : 0);

  return (
    <div className="animate-fade-in" id="tenant-events">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Cari Event & Smart Matching</h1>
          <span className="badge badge-secondary text-[10px]">✨ AI</span>
        </div>
        <p className="text-sm text-muted-foreground">Temukan event yang paling cocok dengan produk dan brand kamu</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" className="input-base pl-11" placeholder="Cari event..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-base w-auto min-w-[180px]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="match">Urutkan: AI Match</option>
          <option value="newest">Terbaru</option>
          <option value="price">Harga Terendah</option>
        </select>
      </div>

      {/* AI Match info */}
      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 mb-6 text-xs text-muted-foreground">
        ✨ <strong>AI Smart Matching</strong> mencocokkan profil brand & produk kamu dengan event yang paling relevan.
        Persentase menunjukkan tingkat kesesuaian. <em className="text-secondary-light">Template UI — implementasi Gemini API oleh tim developer.</em>
      </div>

      {/* Events */}
      <div className="space-y-4">
        {filtered.map((event, i) => (
          <Link key={event.id} href={`/events/${event.id}`} className="block card-interactive p-5 animate-fade-in opacity-0" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-3xl flex-shrink-0">
                {event.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                  <span className="badge badge-primary text-[10px]">{event.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.location}</span>
                  <span>💰 mulai {event.price}</span>
                  <span>🏪 {event.booths} booth tersedia</span>
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className={`text-xl font-bold ${parseInt(event.match) >= 85 ? "text-primary-light" : parseInt(event.match) >= 60 ? "text-accent-light" : "text-muted-foreground"}`}>
                  {event.match}
                </div>
                <div className="text-[10px] text-muted-foreground">Match</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
