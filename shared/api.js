// Shared API client used by BOTH the web and mobile apps.
// It uses plain fetch and has no dependencies, so any change here affects both clients.
//
// createApi({ baseUrl, tokens, onLogout })
//   tokens = { getAccess(), getRefresh(), set(access, refresh), clear() }  (sync or async)

export function createApi({ baseUrl, tokens, onLogout }) {
  async function refresh() {
    const refreshToken = await tokens.getRefresh();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      await tokens.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async function request(path, { method = 'GET', body, auth = true } = {}) {
    const send = async () => {
      const headers = { 'Content-Type': 'application/json' };
      if (auth) {
        const token = await tokens.getAccess();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      return fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    };

    let res;
    try {
      res = await send();
    } catch {
      throw new Error('Cannot reach the server. Check your connection.');
    }

    if (res.status === 401 && auth) {
      if (await refresh()) {
        res = await send();
      } else {
        await tokens.clear();
        if (onLogout) onLogout();
        throw new Error('Your session expired. Sign in again.');
      }
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
    return data;
  }

  return {
    async login(identifier, password) {
      const data = await request('/api/auth/login', { method: 'POST', body: { identifier, password }, auth: false });
      await tokens.set(data.accessToken, data.refreshToken);
      return data.user;
    },
   sendOtp: (mobile) => request('/api/auth/otp/send', { method: 'POST', body: { mobile }, auth: false }),
    async verifyOtp(mobile, otp) {
      const data = await request('/api/auth/otp/verify', { method: 'POST', body: { mobile, otp }, auth: false });
      await tokens.set(data.accessToken, data.refreshToken);
      return data.user;
    },

    logout: () => tokens.clear(),
    hasSession: async () => !!(await tokens.getAccess()),

    getProfile: () => request('/api/profile'),
    updateProfile: (p) => request('/api/profile', { method: 'PUT', body: p }),
    changePassword: (currentPassword, newPassword) =>
      request('/api/profile/password', { method: 'PUT', body: { currentPassword, newPassword } }),

    getDashboard: () => request('/api/dashboard'),

    listCommodities: () => request('/api/commodities'),
    createCommodity: (c) => request('/api/commodities', { method: 'POST', body: c }),
    updateCommodity: (id, c) => request(`/api/commodities/${id}`, { method: 'PUT', body: c }),
    deleteCommodity: (id) => request(`/api/commodities/${id}`, { method: 'DELETE' }),
  };
}
