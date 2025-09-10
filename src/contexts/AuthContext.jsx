import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const setTokensAndHeader = (access, refresh) => {
    if (access) {
      localStorage.setItem("access_token", access);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    }
    if (refresh) localStorage.setItem("refresh_token", refresh);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser({ authenticated: true });
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
      if (payload.user) setUser(payload.user);
      else setUser({ authenticated: true });
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
        setUser({ authenticated: true });
        return;
      } catch (e) {
        throw err;
      }
    }
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
