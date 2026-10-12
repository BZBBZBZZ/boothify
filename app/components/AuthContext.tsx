"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Role = "organizer" | "tenant";

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => ({ success: false, message: "" }),
  register: () => ({ success: false, message: "" }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Helper to safely access localStorage
function getStoredUsers(): Array<User & { password: string }> {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("boothify_users");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
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
    const { password: _, ...userData } = found;
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

  const logout = useCallback(() => {
    setUser(null);
    setStoredCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
