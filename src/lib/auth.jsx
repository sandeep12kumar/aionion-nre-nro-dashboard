import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // local sign-out (also used when the server answers 401)
  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {}).finally(clear);
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (!getToken()) {
      setReady(true);
      return;
    }
    api.get("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [clear]);

  const login = useCallback(async (username, password) => {
    const data = await api.post("/auth/login", { username, password });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await api.post("/auth/change-password", { currentPassword, newPassword });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(() => ({
    user, ready, login, logout, changePassword,
    can: (module) => Boolean(user?.modules?.includes(module)),
  }), [user, ready, login, logout, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const ROLE_LABELS = { super_admin: "Super Admin", admin: "Admin", viewer: "Viewer" };
export const MODULE_LABELS = {
  dashboard: "Dashboard", clients: "Clients", payments: "Payments", ipv: "IPV Verification", boid: "BOID Numbers", users: "User Management", audit: "Audit Logs",
};
