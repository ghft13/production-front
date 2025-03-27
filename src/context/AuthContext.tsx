

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface User {
  name: string;
  email?: string;
  role: "homeowner" | "provider" | "admin";
  adminId?: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  adminLogin: (adminId: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("doit-token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        let response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.log("Fetching regular user failed, checking for admin...");
          response = await fetch(`${API_BASE_URL}/api/auth/admin`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error("User not found");
          }
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("doit-token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("doit-token");
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const { token, user } = await response.json();
      localStorage.setItem("doit-token", token);
      setUser(user);

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const adminLogin = async (adminId: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("doit-token", data.token); // Store admin token
        setUser({
          name: data.user.name,
          email: data.user.email,
          role: "admin",
          adminId: data.user.adminId,
        });

        return true;
      } else {
        console.error("Admin login failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    }
  };

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, isAuthenticated, isAdmin, login, adminLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
