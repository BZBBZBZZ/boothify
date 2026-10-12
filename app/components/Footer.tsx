import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-lg font-bold">
                Booth<span className="gradient-text">ify</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Platform digital modern untuk booking booth event, pameran & bazar.
              Menghubungkan pelaku usaha dengan penyelenggara event secara efisien.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: "Jelajahi Event", href: "/events" },
                { label: "Buat Event", href: "/dashboard/organizer/events/new" },
                { label: "Sewa Booth", href: "/events/1" },
                { label: "Panduan Digital", href: "/events/1/guide" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary-light transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Perusahaan</h4>
            <ul className="space-y-3">
              {[
                { label: "Tentang Kami", href: "/#features" },
                { label: "Cara Kerja", href: "/#how-it-works" },
                { label: "Event Populer", href: "/#events" },
                { label: "Kontak Support", href: "mailto:support@boothify.id" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary-light transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Bantuan &amp; Panduan</h4>
            <ul className="space-y-3">
              {[
                { label: "Pusat Bantuan", href: "/events/1/guide" },
                { label: "Denah Interaktif", href: "/events/1" },
                { label: "Portal Organizer", href: "/dashboard/organizer" },
                { label: "Portal Tenant", href: "/dashboard/tenant" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary-light transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Boothify. Platform Digital Pemesanan Booth &amp; Manajemen Event.
          </p>
          <div className="flex items-center gap-4">
            {/* Social icons */}
            {[
              { label: "Instagram", href: "https://instagram.com", path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" },
              { label: "Twitter", href: "https://x.com", path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" },
              { label: "LinkedIn", href: "https://linkedin.com", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary-light hover:bg-primary/10 transition"
                aria-label={social.label}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
