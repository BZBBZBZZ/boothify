"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import Navbar from "../../components/Navbar";
import { EVENT_CATEGORY_OPTIONS } from "../../lib/event-categories";
import BrandMark from "../../components/BrandMark";
import FreshOnNavigate from "../../components/FreshOnNavigate";
import { Field, Notice, Stepper } from "../../components/ui";
import { homeForRole, safeNextPath } from "../../lib/auth-redirect";

type Role = "tenant" | "organizer";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  businessCategory: "",
  description: "",
  phone: "",
};

/** What each role can do, shown on the role cards and the side panel. */
const ROLE_INFO: Record<Role, { title: string; subtitle: string; perks: string[]; next: string[] }> = {
  organizer: {
    title: "Organizer",
    subtitle: "Saya penyelenggara event, bazar, atau pameran.",
    perks: ["Buat event dan atur denah booth", "Terima sewa booth dari tenant", "Bagikan QR panduan untuk pengunjung"],
    next: ["Lengkapi profil organisasi", "Buat event pertama", "Tata denah booth lalu terbitkan", "Bagikan QR Code ke pengunjung"],
  },
  tenant: {
    title: "Tenant",
    subtitle: "Saya pelaku usaha yang ingin menyewa booth.",
    perks: ["Cari event yang cocok dengan usahamu", "Pilih dan sewa booth langsung dari denah", "Terima pesanan pengunjung saat acara"],
    next: ["Lengkapi profil usaha", "Cari event dan sewa booth", "Isi menu atau katalog produk", "Buat mini website booth"],
  },
};

const STEP_LABELS: Record<Role, string[]> = {
  organizer: ["Pilih peran", "Data akun", "Profil organisasi"],
  tenant: ["Pilih peran", "Data akun", "Profil usaha"],
};

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user } = useAuth();
  const next = safeNextPath(searchParams.get("next"));
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Set when Supabase asks the new user to confirm their email before signing in
  const [confirmEmail, setConfirmEmail] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const set = (key: keyof typeof EMPTY_FORM, value: string) => setFormData((d) => ({ ...d, [key]: value }));

  // A role in the link (?role=tenant) is picked for the visitor already
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "organizer" || roleParam === "tenant") setRole(roleParam);
  }, [searchParams]);

  // Already signed in with a real account: go to that account's home.
  // A guest visitor (who only ordered food) may still create an account.
  const signedIn = Boolean(user && user.role !== "guest");
  // Set once this form signs someone in, so the form's own redirect (to `next`) is the one that wins
  const submittedRef = useRef(false);
  useEffect(() => {
    if (submittedRef.current) return;
    if (user && user.role !== "guest") router.replace(homeForRole(user.role));
  }, [user, router]);

  if (signedIn) return null;

  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";
  const steps = STEP_LABELS[role || "tenant"];
  const info = role ? ROLE_INFO[role] : null;

  // Going back keeps what was typed, so nobody has to fill it in twice
  const goBack = () => {
    setError("");
    setStep((s) => (s > 0 ? ((s - 1) as 0 | 1) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 0) {
      if (!role) {
        setError("Pilih dulu kamu mendaftar sebagai Organizer atau Tenant.");
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      if (formData.password.length < 8) {
        setError("Kata sandi minimal 8 karakter.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Konfirmasi kata sandi belum sama dengan kata sandi.");
        return;
      }
      setStep(2);
      return;
    }

    // Last step: create the account in Supabase
    if (submitting || !role) return;
    setSubmitting(true);
    submittedRef.current = true;
    const result = await register(
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role,
        businessName: formData.businessName.trim(),
        businessCategory: formData.businessCategory,
        phone: formData.phone.trim(),
        description: formData.description.trim(),
      },
      formData.password
    );

    if (result.success && !result.needsConfirmation) {
      router.replace(next || homeForRole(result.role));
      return;
    }
    submittedRef.current = false;
    setSubmitting(false);
    if (result.success && result.needsConfirmation) {
      setConfirmEmail(formData.email.trim().toLowerCase());
      setFormData(EMPTY_FORM);
      setStep(0);
      return;
    }
    setError(result.message);
  };

  const BackButton = (
    <button type="button" onClick={goBack} className="btn btn-ghost btn-sm -ml-3 mb-4">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Kembali
    </button>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex pt-16" id="register-page">
        {/* Side panel: what happens after signing up */}
        <aside className="auth-panel hidden lg:flex lg:w-1/2 relative overflow-hidden items-center">
          <div className="relative z-10 max-w-md px-12">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <span className="wordmark text-3xl"><BrandMark size={32} /><span>Boothify</span></span>
            </Link>
            <h2 className="text-4xl font-semibold leading-tight mb-4">Daftar di Boothify</h2>
            <p className="auth-panel-text leading-relaxed mb-10">
              Pendaftaran hanya 3 langkah. Setelah itu dasbor kamu akan memandu langkah pertamanya.
            </p>
            {info ? (
              <div>
                <p className="text-sm font-semibold mb-3">Setelah daftar sebagai {info.title}, kamu akan:</p>
                <ol className="space-y-2 text-sm auth-panel-text list-decimal pl-5">
                  {info.next.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            ) : (
              <p className="text-sm auth-panel-text">Pilih peran di sebelah kanan untuk melihat langkah selanjutnya.</p>
            )}
          </div>
        </aside>

        {/* Form */}
        <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="wordmark text-2xl"><BrandMark size={24} /><span>Boothify</span></span>
              </Link>
            </div>

            <Stepper steps={steps} current={step} />

            {confirmEmail && (
              <Notice tone="ok" title="Akun berhasil dibuat" className="mb-6" id="register-confirm-notice">
                Kami mengirim tautan konfirmasi ke <strong>{confirmEmail}</strong>. Buka email itu, klik tautannya, lalu{" "}
                <Link href={loginHref} className="font-semibold underline">masuk</Link>.
              </Notice>
            )}

            {error && <Notice tone="error" className="mb-4">{error}</Notice>}

            <form onSubmit={handleSubmit} noValidate={step === 0}>
              {/* STEP 1: role */}
              {step === 0 && (
                <div className="animate-fade-in">
                  <h1 className="page-header-title mb-2">Kamu mendaftar sebagai apa?</h1>
                  <p className="page-header-desc mb-6">Peran menentukan menu dan fitur di dasbor. Satu akun hanya untuk satu peran.</p>
                  <fieldset className="space-y-3">
                    <legend className="visually-hidden">Pilih peran</legend>
                    {(Object.keys(ROLE_INFO) as Role[]).map((key) => (
                      <label key={key} className="choice-card" id={`role-${key}`}>
                        <input
                          type="radio"
                          name="role"
                          value={key}
                          className="visually-hidden"
                          checked={role === key}
                          onChange={() => {
                            if (key !== role) setFormData((d) => ({ ...d, businessCategory: "" }));
                            setRole(key);
                            setError("");
                          }}
                        />
                        <span className="choice-card-icon" aria-hidden="true">
                          {key === "organizer" ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold">{ROLE_INFO[key].title}</span>
                          <span className="block text-sm text-muted-foreground">{ROLE_INFO[key].subtitle}</span>
                          <ul className="choice-card-list">
                            {ROLE_INFO[key].perks.map((perk) => <li key={perk}>{perk}</li>)}
                          </ul>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <button type="submit" className="btn btn-primary w-full btn-lg mt-8" id="register-next-step1">
                    {role ? `Lanjut sebagai ${ROLE_INFO[role].title}` : "Lanjut"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}

              {/* STEP 2: account */}
              {step === 1 && role && (
                <div className="animate-fade-in">
                  {BackButton}
                  <h1 className="page-header-title mb-2">Data akun</h1>
                  <p className="page-header-desc mb-6">Dipakai untuk masuk ke Boothify sebagai {ROLE_INFO[role].title}.</p>
                  <div className="space-y-4">
                    <Field label="Nama lengkap" required id="reg-name">
                      {(id) => <input id={id} type="text" autoComplete="name" className="input-base" placeholder="Contoh: Budi Santoso" value={formData.name} onChange={(e) => set("name", e.target.value)} required />}
                    </Field>
                    <Field label="Email" required id="reg-email" hint="Kami kirim tautan konfirmasi ke email ini.">
                      {(id) => <input id={id} type="email" autoComplete="email" className="input-base" placeholder="nama@email.com" value={formData.email} onChange={(e) => set("email", e.target.value)} required />}
                    </Field>
                    <Field label="Nomor WhatsApp" required id="reg-phone" hint={role === "organizer" ? "Tenant dan pengunjung menghubungi kamu lewat nomor ini." : "Organizer menghubungi kamu lewat nomor ini."}>
                      {(id) => <input id={id} type="tel" autoComplete="tel" className="input-base" placeholder="0812 3456 7890" value={formData.phone} onChange={(e) => set("phone", e.target.value)} required />}
                    </Field>
                    <Field label="Kata sandi" required id="reg-password" hint="Minimal 8 karakter.">
                      {(id) => (
                        <div className="relative">
                          <input id={id} type={showPassword ? "text" : "password"} autoComplete="new-password" className="input-base !pr-24" value={formData.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
                          <button type="button" className="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2 !min-h-9" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
                            {showPassword ? "Sembunyikan" : "Tampilkan"}
                          </button>
                        </div>
                      )}
                    </Field>
                    <Field label="Ulangi kata sandi" required id="reg-confirm">
                      {(id) => <input id={id} type={showPassword ? "text" : "password"} autoComplete="new-password" className="input-base" value={formData.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} required />}
                    </Field>
                  </div>
                  <button type="submit" className="btn btn-primary w-full btn-lg mt-8" id="register-next-step2">
                    Lanjut ke {steps[2]}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}

              {/* STEP 3: business / organisation profile */}
              {step === 2 && role && (
                <div className="animate-fade-in">
                  {BackButton}
                  <h1 className="page-header-title mb-2">{steps[2]}</h1>
                  <p className="page-header-desc mb-6">
                    {role === "organizer"
                      ? "Nama organisasi tampil di setiap event yang kamu buat."
                      : "Dipakai untuk mencocokkan kamu dengan event yang sesuai. Bisa diubah nanti di Profil."}
                  </p>
                  <div className="space-y-4">
                    <Field label={role === "organizer" ? "Nama organisasi" : "Nama brand / toko"} required id="reg-business">
                      {(id) => <input id={id} type="text" className="input-base" placeholder={role === "organizer" ? "Contoh: PT Event Nusantara" : "Contoh: Kopi Senja"} value={formData.businessName} onChange={(e) => set("businessName", e.target.value)} required />}
                    </Field>
                    {role === "tenant" && (
                      <Field label="Kategori usaha" required id="reg-category" hint="Event dengan kategori yang sama akan direkomendasikan di dasbor.">
                        {(id) => (
                          <select id={id} className="input-base" value={formData.businessCategory} onChange={(e) => set("businessCategory", e.target.value)} required>
                            <option value="">Pilih kategori</option>
                            {EVENT_CATEGORY_OPTIONS.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                          </select>
                        )}
                      </Field>
                    )}
                    <Field label="Deskripsi singkat" optional id="reg-desc">
                      {(id) => <textarea id={id} className="input-base min-h-[100px] resize-y" placeholder={role === "organizer" ? "Event apa saja yang biasa kamu selenggarakan?" : "Produk apa yang kamu jual?"} value={formData.description} onChange={(e) => set("description", e.target.value)} rows={4} />}
                    </Field>
                  </div>
                  <button type="submit" className="btn btn-primary w-full btn-lg mt-8" id="register-submit" disabled={submitting}>
                    {submitting ? "Membuat akun..." : "Buat akun"}
                  </button>
                </div>
              )}
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Sudah punya akun?{" "}
              <Link href={loginHref} className="text-primary-light font-semibold hover:underline">Masuk di sini</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat pendaftaran...</div>}>
      <FreshOnNavigate>
        <RegisterFormContent />
      </FreshOnNavigate>
    </Suspense>
  );
}
