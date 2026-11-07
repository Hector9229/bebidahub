import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  clearSession,
  getStoredUser,
  saveSession,
  updateStoredUser,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [checking, setChecking] = useState(Boolean(getStoredUser()));

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener("bh:session-expired", handleExpired);
    return () => window.removeEventListener("bh:session-expired", handleExpired);
  }, []);

  useEffect(() => {
    let active = true;
    if (!getStoredUser()) {
      setChecking(false);
      return undefined;
    }
    api
      .get("/auth/me/")
      .then(({ data }) => {
        if (!active) return;
        updateStoredUser(data);
        setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login/", { email, password });
    saveSession(data);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register/", payload);
    saveSession(data);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refresh = localStorage.getItem("bh_refresh");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // El token pudo expirar; cerramos la sesión local de todos modos.
    } finally {
      clearSession();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      checking,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, checking]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
