import { Api } from './Api';

// Запросы идут на origin React: /api перенаправляется Vite Proxy на :8080.
// JWT для защищённых запросов берётся исключительно из текущего Redux (не из
// localStorage), чтобы после F5 гостевой интерфейс оставался гостевым.
export const api = new Api({ baseURL: '/api' });
export const bearerHeaders = (token: string | null) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};
