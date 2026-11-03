import * as SecureStore from 'expo-secure-store';
import { createApi } from '../../shared/api.js';
import { API_URL } from './config';

const A = 'mt_access', R = 'mt_refresh';
const tokens = {
  getAccess: () => SecureStore.getItemAsync(A),
  getRefresh: () => SecureStore.getItemAsync(R),
  set: async (a, r) => { await SecureStore.setItemAsync(A, a); await SecureStore.setItemAsync(R, r); },
  clear: async () => { await SecureStore.deleteItemAsync(A); await SecureStore.deleteItemAsync(R); },
};

let logoutListener = () => {};
export const setLogoutListener = (fn) => { logoutListener = fn; };

export const api = createApi({ baseUrl: API_URL, tokens, onLogout: () => logoutListener() });
