import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

const ACCESS_KEY = "bh_access";
const REFRESH_KEY = "bh_refresh";
const USER_KEY = "bh_user";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession({ access, refresh, user }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateTokens(access, refresh) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login/") ||
      url.includes("/auth/refresh/") ||
      url.includes("/auth/register/");

    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      clearSession();
      window.dispatchEvent(new Event("bh:session-expired"));
      return Promise.reject(error);
    }

    original._retry = true;
    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${API_URL}/auth/refresh/`, { refresh }, { timeout: 20000 })
        .then(({ data }) => {
          updateTokens(data.access, data.refresh);
          return data.access;
        })
        .catch((refreshError) => {
          clearSession();
          window.dispatchEvent(new Event("bh:session-expired"));
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccess = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

/** Convierte errores de DRF/Axios en un string legible para el usuario. */
export function getErrorMessage(error) {
  if (!error?.response) {
    if (error?.code === "ECONNABORTED") {
      return "La solicitud tardó demasiado. Intenta de nuevo.";
    }
    return "No pudimos conectar con el servidor. Revisa que el backend esté activo.";
  }
  const data = error.response.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors) return [].concat(data.non_field_errors).join(" ");
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const value = data[firstKey];
    if (Array.isArray(value)) return `${value[0]}`;
    if (typeof value === "string") return value;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** Normaliza errores por campo de DRF a { campo: "mensaje" }. */
export function getFieldErrors(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) result[key] = String(value[0]);
    else if (typeof value === "string") result[key] = value;
  });
  return result;
}
