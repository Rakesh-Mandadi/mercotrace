import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setLogoutListener } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLogoutListener(() => setUser(null));
    (async () => {
      try { if (await api.hasSession()) setUser(await api.getProfile()); } catch (e) { /* signed out */ }
      setLoading(false);
    })();
  }, []);

  const login = async (identifier, password) => setUser(await api.login(identifier, password));
    const loginWithOtp = async (mobile, otp) => setUser(await api.verifyOtp(mobile, otp));
  const logout = async () => { await api.logout(); setUser(null); };

//  return <Ctx.Provider value={{ user, setUser, loading, login, logout }}>{children}</Ctx.Provider>;
    return <Ctx.Provider value={{ user, setUser, loading, login, loginWithOtp, logout }}>{children}</Ctx.Provider>;
}
