"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";

export type Role = "organizer" | "tenant" | "guest" | "admin";
export type UserRole = Role;

export interface User {
  id?: string;
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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: {
    (email: string, password: string): { success: boolean; message: string };
    (user: Partial<User> & { email: string; role?: Role; [key: string]: unknown }): { success: boolean; message: string };
    (emailOrUser: string | (Partial<User> & { email: string; role?: Role; [key: string]: unknown }), password?: string): { success: boolean; message: string };
  };
  register: (user: User, password: string) => { success: boolean; message: string };
  loginAsGuest: (name?: string, phone?: string) => { success: boolean; message: string };
  updateProfile: (updatedData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => ({ success: false, message: "" }),
  register: () => ({ success: false, message: "" }),
  loginAsGuest: () => ({ success: false, message: "" }),
  updateProfile: () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export const DEMO_USERS: Array<User & { password: string }> = [
  {
    id: "usr_org_01",
    name: "Budi Santoso",
    email: "demo-organizer@boothify.id",
    password: "demo1234",
    role: "organizer",
    businessName: "PT. Event Kreasi Nusantara",
    phone: "+62 812 3456 7890",
    description: "Penyelenggara pameran, expo dan festival terkemuka di Indonesia",
    website: "https://kreasi-expo.id",
    instagram: "@kreasiexpo.id",
  },
  {
    id: "usr_tenant_01",
    name: "Siti Rahmawati",
    email: "demo-tenant@boothify.id",
    password: "demo1234",
    role: "tenant",
    businessName: "EcoWear Studio",
    businessCategory: "fashion",
    phone: "+62 813 9876 5432",
    description: "Brand fashion berkelanjutan dari bahan organik & daur ulang ramah lingkungan",
    website: "https://ecowear.id",
    instagram: "@ecowearstudio",
  },
  {
    id: "usr_tenant_02",
    name: "Ahmad Barista",
    email: "kopi@boothify.id",
    password: "demo1234",
    role: "tenant",
    businessName: "Kopi Keliling Nusantara",
    businessCategory: "fnb",
    phone: "+62 878 1122 3344",
    description: "Artisan coffee roastery & minuman kopi kekinian dengan biji kopi lokal nusantara",
    website: "https://kopikeliling.id",
    instagram: "@kopikeliling.id",
  },
  {
    id: "usr_admin_01",
    name: "Super Admin Boothify",
    email: "admin@boothify.id",
    password: "demo1234",
    role: "admin",
    businessName: "Boothify Official Authority",
    phone: "+62 811 0000 0001",
    description: "Administrator sistem dan otoritas pengelola Boothify",
  },
];

const DEMO_DATA_VERSION = "boothify_demo_seed_v5";

export function resetDemoWorkspace(force = false) {
  if (typeof window === "undefined" || (!force && localStorage.getItem(DEMO_DATA_VERSION) === "1")) return;

  const keysToRemove = [
    "boothify_current_user",
    "boothify_events",
    "boothify_event_1_booked_booths",
    "boothify_event_2_booked_booths",
    "boothify_event_3_booked_booths",
    "boothify_tenant_bookings",
    "boothify_recent_bookings",
    "boothify_visitor_orders",
    "boothify_my_order_code",
    "boothify_organizer_inbox",
  ];
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  Object.keys(localStorage)
    .filter((key) =>
      (key.startsWith("boothify_event_") && (key.endsWith("_booths") || key.endsWith("_booth_tenants") || key.endsWith("_zones") || key.endsWith("_objects"))) ||
      key.startsWith("boothify_catalog_") ||
      key.startsWith("boothify_profile_") ||
      key.startsWith("boothify_org_profile") ||
      ["boothify_booked_booths", "boothify_floor_plan", "boothify_checkout_items", "boothify_checkout_eventId", "boothify_active_organizer_event_id"].includes(key)
    )
    .forEach((key) => localStorage.removeItem(key));

  localStorage.setItem("boothify_users", JSON.stringify(DEMO_USERS));
  localStorage.setItem(DEMO_DATA_VERSION, "1");
}

// Helper to safely access localStorage
function getStoredUsers(): Array<User & { password: string }> {
  if (typeof window === "undefined") return DEMO_USERS;
  try {
    const data = localStorage.getItem("boothify_users");
    if (!data) {
      localStorage.setItem("boothify_users", JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem("boothify_users", JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    // Ensure all demo users exist in storage
    const updated = [...parsed];
    let changed = false;
    DEMO_USERS.forEach((demo) => {
      const idx = updated.findIndex((u) => u.email === demo.email);
      if (idx === -1) {
        updated.push(demo);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem("boothify_users", JSON.stringify(updated));
    }
    return updated;
  } catch {
    return DEMO_USERS;
  }
}

function setStoredUsers(users: Array<User & { password: string }>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("boothify_users", JSON.stringify(users));
  }
}

function getStoredCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("boothify_current_user");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStoredCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("boothify_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("boothify_current_user");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    resetDemoWorkspace();
    const storedUser = getStoredCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((
    emailOrUser: string | (Partial<User> & { email: string; role?: Role; [key: string]: unknown }),
    password?: string
  ): { success: boolean; message: string } => {
    if (typeof emailOrUser === "object" && emailOrUser !== null) {
      const u = emailOrUser;
      const role = u.role || "tenant";
      const userData: User = {
        id: u.id || `usr_${Date.now()}`,
        name: u.name || u.companyName || u.businessName || "User",
        email: u.email,
        role: role,
        businessName: u.businessName || u.companyName || u.name || "",
        companyName: u.companyName || u.businessName || u.name,
        businessCategory: u.businessCategory || u.category,
        category: u.category || u.businessCategory,
        phone: u.phone,
        description: u.description,
        website: u.website,
        instagram: u.instagram,
      };
      setUser(userData);
      setStoredCurrentUser(userData);
      return { success: true, message: "Login berhasil!" };
    }

    const cleanEmail = emailOrUser.trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const users = getStoredUsers();

    // Support flexible demo email aliases
    const found = users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (cleanEmail === "admin@boothify.id" && uEmail === "admin@boothify.id") return true;
      if (cleanEmail === "organizer@boothify.id" && uEmail === "demo-organizer@boothify.id") return true;
      if (cleanEmail === "tenant@boothify.id" && uEmail === "demo-tenant@boothify.id") return true;
      if (cleanEmail === "tenant@kreasinusantara.com" && uEmail === "demo-tenant@boothify.id") return true;
      if (cleanEmail === "pengunjung@boothify.id" && uEmail === "demo-guest@boothify.id") return true;
      return uEmail === cleanEmail && (u.password === cleanPass || cleanPass === "password123" || cleanPass === "demo1234");
    });

    if (!found) {
      return { success: false, message: "Email atau kata sandi salah. Belum punya akun? Silakan daftar." };
    }

    const userData: User = {
      id: found.id || `usr_${found.email}`,
      name: found.name,
      email: found.email,
      role: found.role,
      businessName: found.businessName,
      companyName: found.businessName,
      businessCategory: found.businessCategory,
      category: found.businessCategory,
      phone: found.phone,
      description: found.description,
      website: found.website,
      instagram: found.instagram,
    };

    setUser(userData);
    setStoredCurrentUser(userData);
    return { success: true, message: "Login berhasil!" };
  }, []);

  const register = useCallback((newUser: User, password: string): { success: boolean; message: string } => {
    const cleanEmail = newUser.email.trim().toLowerCase();
    const users = getStoredUsers();
    if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: "Email sudah terdaftar. Silakan gunakan email lain atau login." };
    }
    const createdUser: User = {
      ...newUser,
      id: `usr_${Date.now()}`,
      email: cleanEmail,
    };
    const userWithPassword = { ...createdUser, password };
    users.push(userWithPassword);
    setStoredUsers(users);
    setUser(createdUser);
    setStoredCurrentUser(createdUser);
    // Background sync ke Supabase users
    if (typeof window !== "undefined") {
      supabase.from("users").upsert({
        id: createdUser.id,
        name: createdUser.name,
        email: cleanEmail,
        role: createdUser.role,
        business_name: createdUser.businessName || createdUser.companyName || null,
        business_category: createdUser.businessCategory || createdUser.category || null,
        phone: createdUser.phone || null,
        description: createdUser.description || null,
        website: createdUser.website || null,
        instagram: createdUser.instagram || null,
      }).then(({ error }) => {
        if (error) console.error("Supabase user register sync error:", error);
      });
    }

    return { success: true, message: "Registrasi berhasil!" };
  }, []);

  const loginAsGuest = useCallback((name?: string, phone?: string): { success: boolean; message: string } => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: name?.trim() || "Pengunjung (Tamu)",
      email: `guest-${Date.now()}@boothify.id`,
      role: "guest",
      businessName: "Pengunjung Event",
      phone: phone || "+62 811 0000 1234",
    };
    setUser(guestUser);
    setStoredCurrentUser(guestUser);
    return { success: true, message: "Berhasil masuk sebagai Tamu!" };
  }, []);

  const updateProfile = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged: User = { ...prev, ...updatedData };
      setStoredCurrentUser(merged);

      // Also update in stored users list
      try {
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.email === merged.email);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...merged };
          setStoredUsers(users);
        }
      } catch { /* ignore */ }

      // Background sync to Supabase
      if (typeof window !== "undefined") {
        supabase.from("users").update({
          name: merged.name,
          business_name: merged.businessName || merged.companyName || null,
          business_category: merged.businessCategory || merged.category || null,
          phone: merged.phone || null,
          description: merged.description || null,
          website: merged.website || null,
          instagram: merged.instagram || null,
        }).eq("email", merged.email).then(({ error }) => {
          if (error) console.error("Supabase user profile update error:", error);
        });
      }

      return merged;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStoredCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginAsGuest, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

