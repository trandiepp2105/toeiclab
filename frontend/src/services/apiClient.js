import axios from "axios";
import Cookies from "js-cookie";

/**
 * URL gốc của REST API.
 */
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

/**
 * Axios instance dùng chung cho toàn bộ frontend.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * Lưu cặp JWT dùng cho các request tiếp theo.
 */
export const saveTokenPair = ({ access, refresh }) => {
  const cookieOptions = {
    expires: refresh ? 14 : 1,
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
  };

  if (access) Cookies.set("access", access, cookieOptions);
  if (refresh) Cookies.set("refresh", refresh, cookieOptions);
};

/**
 * Xóa JWT khỏi trình duyệt khi logout hoặc refresh thất bại.
 */
export const clearTokenPair = () => {
  Cookies.remove("access", { path: "/" });
  Cookies.remove("refresh", { path: "/" });
};

/**
 * Trạng thái refresh token hiện tại.
 *
 * Khi nhiều request cùng nhận 401, chỉ request đầu tiên thực hiện refresh.
 * Các request còn lại được đưa vào hàng đợi và chạy lại sau khi refresh xong.
 */
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Thông báo kết quả refresh cho các request đang chờ.
 *
 * @param {Error|null} error - Lỗi refresh nếu refresh thất bại.
 * @param {string} token - Access token mới.
 */
const notifyRefreshSubscribers = (error, token) => {
  refreshSubscribers.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  refreshSubscribers = [];
};

/**
 * Lấy thông báo lỗi mà backend đã chuẩn hóa cho người dùng.
 * Axios mặc định chỉ trả về "Request failed with status code ...", vốn không
 * đủ thông tin để người dùng biết cần làm gì tiếp theo.
 */
const getUserFriendlyErrorMessage = (error) => {
  const payload = error.response?.data;

  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.message === "string") return payload.message;

  const validationMessages = Object.values(payload || {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => typeof value === "string");
  if (validationMessages.length > 0) return validationMessages[0];

  return error.message;
};

/**
 * Thêm token và CSRF token vào request trước khi gửi.
 */
apiClient.interceptors.request.use(async (config) => {
  if (config._skipAuthToken) {
    return config;
  }

  const accessToken = Cookies.get("access");

  if (accessToken && accessToken !== "undefined") {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/**
 * Tự động refresh access token khi API trả về 401.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    error.message = getUserFriendlyErrorMessage(error);
    const originalRequest = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = Cookies.get("refresh");

      if (!refreshToken) {
        throw new Error("Refresh token không tồn tại.");
      }

      const response = await apiClient.post("/auth/refresh-token/", {
        refresh: refreshToken,
      }, {
        _skipAuthRefresh: true,
        _skipAuthToken: true,
      });

      const newToken = response.data.access;

      saveTokenPair(response.data);

      notifyRefreshSubscribers(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokenPair();

      notifyRefreshSubscribers(refreshError);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
