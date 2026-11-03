import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const TOKEN_COOKIE_PATH = "/manage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

function saveTokenPair({ access, refresh }) {
  const options = {
    path: TOKEN_COOKIE_PATH,
    sameSite: "lax",
    secure: window.location.protocol === "https:",
  };
  if (access) Cookies.set("admin_access", access, { ...options, expires: 1 });
  if (refresh) Cookies.set("admin_refresh", refresh, { ...options, expires: 14 });
}

function clearTokenPair() {
  Cookies.remove("admin_access", { path: TOKEN_COOKIE_PATH });
  Cookies.remove("admin_refresh", { path: TOKEN_COOKIE_PATH });
}

apiClient.interceptors.request.use((config) => {
  if (!config._skipAuthToken) {
    const accessToken = Cookies.get("admin_access");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status !== 401 || !request || request._retry || request._skipAuthRefresh) {
      return Promise.reject(error);
    }

    request._retry = true;
    const refreshToken = Cookies.get("admin_refresh");
    if (!refreshToken) {
      clearTokenPair();
      return Promise.reject(error);
    }

    try {
      const response = await apiClient.post(
        "/auth/refresh-token/",
        { refresh: refreshToken },
        { _skipAuthToken: true, _skipAuthRefresh: true },
      );
      saveTokenPair(response.data);
      request.headers.Authorization = `Bearer ${response.data.access}`;
      return apiClient(request);
    } catch (refreshError) {
      clearTokenPair();
      return Promise.reject(refreshError);
    }
  },
);

export { clearTokenPair, saveTokenPair };
export default apiClient;
