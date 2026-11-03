import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (await api.hasSession()) setUser(await api.getProfile());
      } catch { /* not signed in */ }
      setLoading(false);
    })();
    const onLogout = () => setUser(null);
    window.addEventListener('mt-logout', onLogout);
    return () => window.removeEventListener('mt-logout', onLogout);
  }, []);

  const login = async (identifier, password) => setUser(await api.login(identifier, password));
    const loginWithOtp = async (mobile, otp) => setUser(await api.verifyOtp(mobile, otp));
  const logout = async () => { await api.logout(); setUser(null); };

  //return <Ctx.Provider value={{ user, setUser, loading, login, logout }}>{children}</Ctx.Provider>;
    return <Ctx.Provider value={{ user, setUser, loading, login, loginWithOtp, logout }}>{children}</Ctx.Provider>;
}
