import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setAuthToken, getAuthToken, formatApiError } from "@/lib/api";

const AuthContext = createContext(null);
const USER_KEY = "pc_user_v1";

function normalize(res) {
  // Backend AuthResponse: { customerId, email, firstName, lastName, admin, accessToken, refreshToken }
  return {
    id: res.customerId,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    role: res.admin ? "admin" : "customer",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return getAuthToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persist = useCallback((res) => {
    setAuthToken(res.accessToken);
    if (res.refreshToken) localStorage.setItem("pc_refresh_v1", res.refreshToken);
    const u = normalize(res);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      return persist(data);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const register = useCallback(async ({ email, password, firstName, lastName }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { email, password, firstName, lastName });
      return persist(data);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("pc_refresh_v1");
    setUser(null);
  }, []);

  // Keep in-memory state consistent if token vanished in another tab.
  useEffect(() => {
    if (!getAuthToken() && user) setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, formatApiError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
