import apiClient, { clearTokenPair, saveTokenPair } from "./apiClient";
import Cookies from "js-cookie";

/**
 * Chuyển Axios response thành dữ liệu response.
 *
 * @param {Promise} request - Axios request.
 * @returns {Promise<unknown>} Dữ liệu trả về từ API.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

/**
 * Lưu JWT sau các API authentication trả về token.
 */
const getAuthenticatedResponse = (request) => {
  return request.then((response) => {
    if (response.data?.access && response.data?.refresh) {
      saveTokenPair(response.data);
    }

    return response.data;
  });
};

const authService = {
  /**
   * Lấy thông tin người dùng hiện tại.
   *
   * @returns {Promise<Object>} Thông tin tài khoản.
   */
  me() {
    return getResponseData(apiClient.get("/auth/me/"));
  },

  /**
   * Đăng nhập bằng email và mật khẩu.
   *
   * @param {string} email - Email tài khoản.
   * @param {string} password - Mật khẩu.
   * @returns {Promise<Object>} Người dùng và token phiên đăng nhập.
   */
  login(email, password) {
    return getAuthenticatedResponse(
      apiClient.post("/auth/login/", { email, password }),
    );
  },

  /**
   * Đăng nhập bằng Google credential.
   *
   * @param {string} credential - Google ID token.
   * @returns {Promise<Object>} Người dùng và token phiên đăng nhập.
   */
  googleLogin(credential) {
    return getAuthenticatedResponse(
      apiClient.post("/auth/google/", { credential }),
    );
  },

  /**
   * Gửi OTP để bắt đầu đăng ký tài khoản.
   */
  requestRegisterOtp(email, password, display_name) {
    return getResponseData(
      apiClient.post("/auth/register/request-otp/", {
        email,
        password,
        display_name,
      }),
    );
  },

  /**
   * Xác thực OTP và hoàn tất đăng ký tài khoản.
   */
  verifyRegisterOtp(email, otp) {
    return getAuthenticatedResponse(
      apiClient.post("/auth/register/verify/", {
        email,
        otp,
      }),
    );
  },

  /** Gửi OTP đặt lại mật khẩu tới địa chỉ email đã đăng ký. */
  requestPasswordResetOtp(email) {
    return getResponseData(
      apiClient.post("/auth/password-reset/request-otp/", { email }),
    );
  },

  /** Xác nhận OTP và nhận token ngắn hạn để đặt mật khẩu mới. */
  verifyPasswordResetOtp(email, otp) {
    return getResponseData(
      apiClient.post("/auth/password-reset/verify-otp/", { email, otp }),
    );
  },

  /** Hoàn tất đặt mật khẩu mới bằng token dùng một lần. */
  completePasswordReset(resetToken, newPassword) {
    return getResponseData(
      apiClient.post("/auth/password-reset/complete/", {
        reset_token: resetToken,
        new_password: newPassword,
      }),
    );
  },

  /**
   * Làm mới access token.
   */
  refreshToken() {
    return apiClient
      .post(
        "/auth/refresh-token/",
        { refresh: Cookies.get("refresh") },
        {
          _skipAuthRefresh: true,
          _skipAuthToken: true,
        },
      )
      .then((response) => {
        saveTokenPair(response.data);
        return response.data;
      });
  },

  /**
   * Đăng xuất tài khoản hiện tại.
   */
  logout() {
    return apiClient.post("/auth/logout/").then((response) => {
      clearTokenPair();
      return response.data;
    });
  },
};

export default authService;
