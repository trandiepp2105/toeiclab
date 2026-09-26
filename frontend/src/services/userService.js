import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const userService = {
  /**
   * Lấy hồ sơ người dùng hiện tại.
   */
  getProfile() {
    return getResponseData(apiClient.get("/auth/me/"));
  },

  /**
   * Cập nhật hồ sơ người dùng.
   *
   * @param {Object} payload - Các trường hồ sơ cần cập nhật.
   */
  updateProfile(payload) {
    return getResponseData(apiClient.patch("/users/me/", payload));
  },

  /**
   * Đổi mật khẩu tài khoản.
   *
   * @param {string} current_password - Mật khẩu hiện tại.
   * @param {string} new_password - Mật khẩu mới.
   */
  changePassword(current_password, new_password) {
    return getResponseData(
      apiClient.post("/users/me/change-password/", {
        current_password,
        new_password,
      }),
    );
  },
};

export default userService;
