import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const setTokensAndHeader = (access, refresh) => {
    try {
      if (access) {
        sessionStorage.setItem("access_token", access);
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        // also mirror to localStorage for page reload fallback
        localStorage.setItem("access_token", access);
      }
      if (refresh) {
        sessionStorage.setItem("refresh_token", refresh);
        localStorage.setItem("refresh_token", refresh);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem("access_token"))
      || (typeof localStorage !== 'undefined' && localStorage.getItem("access_token"));
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Try to restore user info from localStorage if available
      try {
        const stored = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem("user_info"))
          || (typeof localStorage !== 'undefined' && localStorage.getItem("user_info"));
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser({ ...parsed, authenticated: true });
          if (!parsed.first_name) {
            (async () => {
              try {
                const profile = await fetchProfile();
                if (profile) {
                  const nextUser = { ...parsed, ...profile, authenticated: true };
                  setUser(nextUser);
                  try { sessionStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
                  try { localStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
                }
              } catch (_) {}
            })();
          }
        } else {
          // No stored user object; set auth flag and try to fetch profile to enrich user data
          setUser({ authenticated: true });
          (async () => {
            try {
              const profile = await fetchProfile();
              if (profile) {
                const nextUser = { ...profile, authenticated: true };
                setUser(nextUser);
                try { sessionStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
                try { localStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
              }
            } catch (_) {}
          })();
        }
      } catch (_) {
        setUser({ authenticated: true });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  const login = async (emailOrUsername, password) => {
    const identifier = (emailOrUsername || "").trim();
    try {
      const res = await api.post("auth/login/", { email: identifier, password });
      const payload = res.data || {};
      const access = payload.access || payload.token || payload.access_token;
      const refresh = payload.refresh || payload.refresh_token;
      setTokensAndHeader(access, refresh);
      // Build a user object from payload to ensure profile fields are available in the app
      const nextUser = {
        username: payload.username || "",
        role: payload.role || "",
        email: payload.email || "",
        company: payload.company || "",
        first_name: payload.first_name || payload.firstName || "",
        last_name: payload.last_name || payload.lastName || "",
        name: payload.name || "",
        authenticated: true,
      };
      // Try to enrich with profile endpoint if first_name is missing
      let enriched = nextUser;
      if (!nextUser.first_name) {
        try {
          const profile = await fetchProfile();
          if (profile) {
            enriched = { ...enriched, ...profile };
          }
        } catch (_) {}
      }
      setUser(enriched);
      try { sessionStorage.setItem("user_info", JSON.stringify(enriched)); } catch (_) {}
      try { localStorage.setItem("user_info", JSON.stringify(enriched)); } catch (_) {}
      return;
    } catch (err) {
      // fallback to token endpoint (email -> username)
      try {
        let res = null;
        try {
          res = await api.post("token/", { email: identifier, password });
        } catch (e) {
          res = await api.post("token/", { username: identifier, password });
        }
        const { access, refresh } = res.data;
        setTokensAndHeader(access, refresh);
        // We don't have profile fields here; keep minimal but persist empty user_info
        // Try to fetch profile to populate names
        let nextUser = { authenticated: true };
        try {
          const profile = await fetchProfile();
          if (profile) nextUser = { ...profile, authenticated: true };
        } catch (_) {}
        setUser(nextUser);
        try { sessionStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
        try { localStorage.setItem("user_info", JSON.stringify(nextUser)); } catch (_) {}
        return;
      } catch (e) {
        throw err;
      }
    }
  };

  // Attempts to fetch the current user's profile from common endpoints
  const fetchProfile = async () => {
    const endpoints = [
      "auth/me/",
      "users/me/",
      "auth/user/",
      "profile/",
    ];
    for (const ep of endpoints) {
      try {
        const res = await api.get(ep);
        const p = res?.data || {};
        // Normalize keys
        return {
          username: p.username || "",
          email: p.email || "",
          role: p.role || p.user_type || "",
          company: p.company || "",
          first_name: p.first_name || p.firstName || "",
          last_name: p.last_name || p.lastName || "",
          name: p.name || "",
        };
      } catch (_) {
        // try next endpoint
      }
    }
    return null;
  };

  // register: include department for hiring_manager and candidate fields explicitly
  // changed: register no longer auto-login or set tokens; returns server response
  const register = async ({
    role = "candidate",
    username,
    email,
    password,
    first_name,
    last_name,
    company,
    department,
    phone,
    extra = {},
  }) => {
    const safeEmail = (email || "").trim();
    const safePassword = password;
    let safeUsername = (username || "").trim();

    if (!safeUsername) {
      const local = safeEmail.split("@")[0] || "user";
      const rand = Math.random().toString(36).slice(2, 6);
      safeUsername = `${local}_${rand}`;
    }

    const payload = {
      username: safeUsername,
      email: safeEmail,
      password: safePassword,
      user_type: role === "hiring_manager" ? "hiring_manager" : "candidate",
      first_name: first_name || "",
      last_name: last_name || "",
      company: company || "",
      department: department || "",
      phone: phone || "",
      ...extra,
    };

    // send register request and return response without logging in
    const res = await api.post("auth/register/", payload);
    return res.data || {};
  };

  const logout = () => {
    try { sessionStorage.removeItem("access_token"); } catch (_) {}
    try { sessionStorage.removeItem("refresh_token"); } catch (_) {}
    try { sessionStorage.removeItem("user_info"); } catch (_) {}
    try { localStorage.removeItem("access_token"); } catch (_) {}
    try { localStorage.removeItem("refresh_token"); } catch (_) {}
    try { localStorage.removeItem("user_info"); } catch (_) {}
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    nav("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
