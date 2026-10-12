"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthContext";

type Role = "tenant" | "organizer" | null;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<Role>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessCategory: "",
    description: "",
    phone: "",
  });

  // Read role from query param
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "organizer" || roleParam === "tenant") {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(user.role === "organizer" ? "/dashboard/organizer" : "/dashboard/tenant");
    }
  }, [user, router]);

  if (user) return null;

  const categories = [
    { value: "fnb", label: "🍜 Food & Beverage (F&B)" },
    { value: "fashion", label: "👗 Fashion & Apparel" },
    { value: "automotive", label: "🚗 Automotive" },
    { value: "education", label: "📚 Education & Tech" },
    { value: "craft", label: "🎨 Craft & Handmade" },
    { value: "health", label: "🏥 Health & Wellness" },
    { value: "other", label: "📦 Lainnya" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!role) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (formData.password !== formData.confirmPassword) {
        setError("Kata sandi tidak cocok!");
        return;
      }
      if (formData.password.length < 8) {
        setError("Kata sandi minimal 8 karakter!");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Register
    const result = register(
      {
        name: formData.name,
        email: formData.email,
        role: role!,
        businessName: formData.businessName,
        businessCategory: formData.businessCategory,
        phone: formData.phone,
        description: formData.description,
      },
      formData.password
    );

    if (result.success) {
      router.push(role === "organizer" ? "/dashboard/organizer" : "/dashboard/tenant");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex" id="register-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-card to-primary/20" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] animate-float delay-300" />

        <div className="relative z-10 max-w-md text-center px-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-2xl font-bold">
              Booth<span className="gradient-text">ify</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Bergabung dengan Boothify</h2>
          <p className="text-muted leading-relaxed">
            {role === "organizer"
              ? "Buat event menakjubkan, kelola booth interaktif, dan jangkau ribuan tenant potensial."
              : role === "tenant"
              ? "Temukan event terbaik, booking booth strategis, dan tingkatkan visibilitas brand kamu."
              : "Pilih peranmu dan mulai perjalanan digitalmu bersama ribuan event di Indonesia."}
          </p>

          {/* Step indicator */}
          <div className="mt-12 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s <= step ? "gradient-primary text-white" : "bg-white/5 text-muted-foreground border border-border"
                }`}>
                  {s < step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 rounded ${s < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {step === 1 ? "Pilih Peran" : step === 2 ? "Data Akun" : "Profil Bisnis"}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-xl font-bold">Booth<span className="gradient-text">ify</span></span>
            </Link>
          </div>

          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? "w-8 bg-primary" : "w-4 bg-border"}`} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-sm text-error animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: Role */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-2">Pilih Peranmu</h1>
                <p className="text-muted-foreground text-sm mb-8">Kamu mau bergabung sebagai apa di Boothify?</p>
                <div className="space-y-4">
                  <button type="button" onClick={() => setRole("organizer")}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                      role === "organizer" ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border hover:border-border-light bg-card"
                    }`} id="role-organizer">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${role === "organizer" ? "bg-primary/20" : "bg-white/5"}`}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={role === "organizer" ? "var(--primary-light)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">Penyelenggara Event (Organizer)</h3>
                        <p className="text-sm text-muted-foreground">Buat & kelola event, atur denah booth interaktif, generate QR Code, dan terima pendaftaran tenant.</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === "organizer" ? "border-primary bg-primary" : "border-border"}`}>
                        {role === "organizer" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setRole("tenant")}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                      role === "tenant" ? "border-secondary bg-secondary/5 shadow-lg shadow-secondary/10" : "border-border hover:border-border-light bg-card"
                    }`} id="role-tenant">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${role === "tenant" ? "bg-secondary/20" : "bg-white/5"}`}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={role === "tenant" ? "var(--secondary-light)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">Pelaku Usaha / Tenant (Brand)</h3>
                        <p className="text-sm text-muted-foreground">Cari event, booking booth strategis, upload katalog produk, dan kelola transaksi saat acara.</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === "tenant" ? "border-secondary bg-secondary" : "border-border"}`}>
                        {role === "tenant" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                    </div>
                  </button>
                </div>
                <button type="submit" disabled={!role} className={`btn btn-primary w-full btn-lg mt-8 ${!role ? "opacity-50 cursor-not-allowed" : ""}`} id="register-next-step1">
                  Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            {/* STEP 2: Account */}
            {step === 2 && (
              <div className="animate-fade-in">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg> Kembali
                </button>
                <h1 className="text-2xl font-bold mb-2">Buat Akun</h1>
                <p className="text-muted-foreground text-sm mb-8">Isi data untuk mendaftar sebagai {role === "organizer" ? "Organizer" : "Tenant"}</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reg-name" className="block text-sm font-medium mb-2">Nama Lengkap</label>
                    <input id="reg-name" type="text" className="input-base" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium mb-2">Email</label>
                    <input id="reg-email" type="email" className="input-base" placeholder="nama@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-sm font-medium mb-2">Nomor Telepon</label>
                    <input id="reg-phone" type="tel" className="input-base" placeholder="+62 812 3456 7890" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium mb-2">Kata Sandi</label>
                    <input id="reg-password" type="password" className="input-base" placeholder="Min. 8 karakter" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm" className="block text-sm font-medium mb-2">Konfirmasi Kata Sandi</label>
                    <input id="reg-confirm" type="password" className="input-base" placeholder="Ulangi kata sandi" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg mt-8" id="register-next-step2">
                  Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            {/* STEP 3: Business Profile */}
            {step === 3 && (
              <div className="animate-fade-in">
                <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg> Kembali
                </button>
                <h1 className="text-2xl font-bold mb-2">{role === "organizer" ? "Profil Organisasi" : "Profil Bisnis"}</h1>
                <p className="text-muted-foreground text-sm mb-8">
                  {role === "organizer" ? "Ceritakan tentang organisasi kamu" : "Ceritakan tentang bisnis dan produk kamu"}
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reg-business" className="block text-sm font-medium mb-2">{role === "organizer" ? "Nama Organisasi" : "Nama Brand / Toko"}</label>
                    <input id="reg-business" type="text" className="input-base" placeholder={role === "organizer" ? "PT. Event Organizer" : "Brand Kamu"} value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} required />
                  </div>
                  {role === "tenant" && (
                    <div>
                      <label htmlFor="reg-category" className="block text-sm font-medium mb-2">Kategori Usaha</label>
                      <select id="reg-category" className="input-base" value={formData.businessCategory} onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })} required>
                        <option value="">Pilih kategori...</option>
                        {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor="reg-desc" className="block text-sm font-medium mb-2">Deskripsi</label>
                    <textarea id="reg-desc" className="input-base min-h-[100px] resize-y" placeholder={role === "organizer" ? "Ceritakan tentang organisasi kamu..." : "Ceritakan tentang produk dan brand kamu..."} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg mt-8" id="register-submit">
                  🚀 Buat Akun & Mulai
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-primary-light font-semibold hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat pendaftaran...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
