import { createApi } from '../../shared/api.js';

const A = 'mt_access', Rf = 'mt_refresh';
const tokens = {
  getAccess: () => localStorage.getItem(A),
  getRefresh: () => localStorage.getItem(Rf),
  set: (a, r) => { localStorage.setItem(A, a); localStorage.setItem(Rf, r); },
  clear: () => { localStorage.removeItem(A); localStorage.removeItem(Rf); },
};

export const api = createApi({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  tokens,
  onLogout: () => window.dispatchEvent(new Event('mt-logout')),
});
