"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import { getProfile, updateProfileRow, errorMessage, type Profile, type ProfilePatch } from "@/app/lib/db";
import type { MediaFile, TenantBranding } from "@/app/lib/event-defaults";

export type Role = "organizer" | "tenant" | "guest" | "admin";
export type UserRole = Role;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessName?: string;
  companyName?: string;
  businessCategory?: string;
  category?: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
  logoUrl?: string;
  catalogType?: "fnb" | "non-fnb";
  mediaFiles?: MediaFile[];
  branding?: Partial<TenantBranding>;
}

export type AuthResult = { success: boolean; message: string; role?: Role; needsConfirmation?: boolean };

export type RegisterInput = {
  name: string;
  email: string;
  role: "organizer" | "tenant";
  businessName?: string;
  businessCategory?: string;
  phone?: string;
  description?: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput, password: string) => Promise<AuthResult>;
  /** A visitor ordering at an event without an account; kept only in this browser tab. */
  loginAsGuest: (name?: string, phone?: string) => void;
  updateProfile: (patch: ProfilePatch) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false, message: "" }),
  register: async () => ({ success: false, message: "" }),
  loginAsGuest: () => {},
  updateProfile: async () => ({ success: false, message: "" }),
  refreshProfile: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const GUEST_KEY = "boothify_guest";

function toUser(p: Profile): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    businessName: p.businessName,
    companyName: p.businessName,
    businessCategory: p.businessCategory,
    category: p.businessCategory,
    phone: p.phone,
    description: p.description,
    website: p.website,
    instagram: p.instagram,
    logoUrl: p.logoUrl,
    catalogType: p.catalogType,
    mediaFiles: p.mediaFiles,
    branding: p.branding,
  };
}

function readGuest(): User | null {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function authMessage(text: string): string {
  if (/invalid login credentials/i.test(text)) return "Email atau kata sandi salah. Belum punya akun? Silakan daftar.";
  if (/email not confirmed/i.test(text)) return "Email belum dikonfirmasi. Buka tautan konfirmasi yang dikirim ke email kamu.";
  if (/already registered|already exists/i.test(text)) return "Email sudah terdaftar. Silakan masuk atau gunakan email lain.";
  if (/password should be at least/i.test(text)) return "Kata sandi terlalu pendek.";
  if (/rate limit|too many/i.test(text)) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (/invalid.*email|email.*invalid/i.test(text)) return "Format email tidak valid.";
  if (/Failed to fetch|NetworkError/i.test(text)) return "Tidak bisa terhubung ke server. Periksa koneksi internet.";
  return text || "Terjadi kesalahan. Coba lagi.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const profile = await getProfile(userId);
      return profile ? toUser(profile) : null;
    } catch {
      return null;
    }
  }, []);

  // Restore the session on load and follow sign-in / sign-out in other tabs
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      const next = sessionUser ? await loadProfile(sessionUser.id) : readGuest();
      if (cancelled) return;
      setUser(next);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(readGuest());
        return;
      }
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        const id = session.user.id;
        // Deferred so the auth client is not called from inside its own callback
        window.setTimeout(() => {
          loadProfile(id).then((p) => {
            if (!cancelled && p) setUser((current) => (current?.id === p.id && current.role === p.role ? { ...current, ...p } : p));
          });
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) return { success: false, message: authMessage(error?.message || "") };
    const profile = await loadProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, message: "Profil akun tidak ditemukan di database. Pastikan supabase/schema.sql sudah dijalankan." };
    }
    try {
      sessionStorage.removeItem(GUEST_KEY);
    } catch { /* ignore */ }
    setUser(profile);
    return { success: true, message: "Login berhasil!", role: profile.role };
  }, [loadProfile]);

  const register = useCallback(async (input: RegisterInput, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/login` : undefined,
        data: {
          name: input.name.trim(),
          role: input.role,
          business_name: input.businessName?.trim() || "",
          business_category: input.businessCategory || "",
          phone: input.phone?.trim() || "",
          description: input.description?.trim() || "",
        },
      },
    });
    if (error) return { success: false, message: authMessage(error.message) };
    // Supabase hides taken emails behind a fake success that has no identities
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { success: false, message: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." };
    }
    if (!data.session || !data.user) {
      return {
        success: true,
        needsConfirmation: true,
        role: input.role,
        message: "Akun dibuat. Cek email kamu dan klik tautan konfirmasi, lalu masuk.",
      };
    }
    const profile = await loadProfile(data.user.id);
    if (!profile) {
      return { success: false, message: "Akun dibuat, tapi profil tidak tersimpan. Pastikan supabase/schema.sql sudah dijalankan." };
    }
    try {
      sessionStorage.removeItem(GUEST_KEY);
    } catch { /* ignore */ }
    setUser(profile);
    return { success: true, message: "Registrasi berhasil!", role: profile.role };
  }, [loadProfile]);

  const loginAsGuest = useCallback((name?: string, phone?: string) => {
    const guest: User = {
      id: "guest",
      name: name?.trim() || "Pengunjung",
      email: "",
      role: "guest",
      phone: phone?.trim() || "",
    };
    try {
      sessionStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    } catch { /* ignore */ }
    setUser(guest);
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch): Promise<AuthResult> => {
    if (!user || user.role === "guest") return { success: false, message: "Masuk dulu untuk menyimpan profil." };
    try {
      const saved = await updateProfileRow(user.id, patch);
      setUser(toUser(saved));
      return { success: true, message: "Profil tersimpan." };
    } catch (err) {
      return { success: false, message: errorMessage(err, "Profil gagal disimpan.") };
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user || user.role === "guest") return;
    const p = await loadProfile(user.id);
    if (p) setUser(p);
  }, [user, loadProfile]);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem(GUEST_KEY);
    } catch { /* ignore */ }
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginAsGuest, updateProfile, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
