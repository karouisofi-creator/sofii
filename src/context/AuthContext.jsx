import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const API_BASE = "/api";
const TOKEN_KEY = "dataflow_token";
const USER_KEY = "dataflow_user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );
  const [loading, setLoading] = useState(true);
  const [authSyncing, setAuthSyncing] = useState(true);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);

    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const apiFetch = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const logout = async () => {
    persistSession("", null);
  };

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error(
        "Backend unreachable. Start the API backend, then retry.",
      );
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Erreur de connexion");
    }

    persistSession(data.token || "", data.user || null);
    return data.user;
  };

  useEffect(() => {
    let cancelled = false;

    const syncAuth = async () => {
      setAuthSyncing(true);

      if (!token) {
        setLoading(false);
        setAuthSyncing(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Session invalide");
        }

        const currentUser = await res.json();
        if (!cancelled) {
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch {
        if (!cancelled) {
          persistSession("", null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAuthSyncing(false);
        }
      }
    };

    syncAuth();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authSyncing,
      login,
      logout,
      apiFetch,
      updateUser,
      isAdmin: () => user?.role === "admin",
    }),
    [authSyncing, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
