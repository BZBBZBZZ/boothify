"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Role = "organizer" | "tenant" | "guest";

interface User {
  name: string;
  email: string;
  role: Role;
  businessName: string;
  businessCategory?: string;
  phone?: string;
  description?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (user: User, password: string) => { success: boolean; message: string };
  loginAsGuest: (name?: string, phone?: string) => { success: boolean; message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => ({ success: false, message: "" }),
  register: () => ({ success: false, message: "" }),
  loginAsGuest: () => ({ success: false, message: "" }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const DEFAULT_USERS: Array<User & { password: string }> = [
  {
    name: "Organizer Event",
    email: "demo-organizer@boothify.id",
    password: "demo1234",
    role: "organizer",
    businessName: "PT. Event Kreasi Nusantara",
    phone: "+62 812 3456 7890",
    description: "Penyelenggara pameran & expo terkemuka di Indonesia",
  },
  {
    name: "Tenant Brand",
    email: "demo-tenant@boothify.id",
    password: "demo1234",
    role: "tenant",
    businessName: "EcoWear Studio",
    businessCategory: "fashion",
    phone: "+62 813 9876 5432",
    description: "Brand fashion ramah lingkungan dari bahan organik dan daur ulang",
  },
  {
    name: "Pengunjung Demo",
    email: "demo-guest@boothify.id",
    password: "demo1234",
    role: "guest",
    businessName: "Pengunjung Event",
    phone: "+62 811 2233 4455",
    description: "Akun tamu untuk transaksi self-ordering di event",
  },
];

// Helper to safely access localStorage
function getStoredUsers(): Array<User & { password: string }> {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const data = localStorage.getItem("boothify_users");
    if (!data) {
      localStorage.setItem("boothify_users", JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function setStoredUsers(users: Array<User & { password: string }>) {
  localStorage.setItem("boothify_users", JSON.stringify(users));
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
    const storedUser = getStoredCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; message: string } => {
    const users = getStoredUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      return { success: false, message: "Email atau kata sandi salah. Belum punya akun? Daftar dulu." };
    }
    const userData: User = {
      name: found.name,
      email: found.email,
      role: found.role,
      businessName: found.businessName,
      businessCategory: found.businessCategory,
      phone: found.phone,
      description: found.description,
    };
    setUser(userData);
    setStoredCurrentUser(userData);
    return { success: true, message: "Login berhasil!" };
  }, []);

  const register = useCallback((newUser: User, password: string): { success: boolean; message: string } => {
    const users = getStoredUsers();
    if (users.find((u) => u.email === newUser.email)) {
      return { success: false, message: "Email sudah terdaftar. Gunakan email lain atau login." };
    }
    const userWithPassword = { ...newUser, password };
    users.push(userWithPassword);
    setStoredUsers(users);
    setUser(newUser);
    setStoredCurrentUser(newUser);
    return { success: true, message: "Registrasi berhasil!" };
  }, []);

  const loginAsGuest = useCallback((name?: string, phone?: string): { success: boolean; message: string } => {
    const guestUser: User = {
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

  const logout = useCallback(() => {
    setUser(null);
    setStoredCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
