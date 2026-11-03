import apiClient, { clearTokenPair, saveTokenPair } from "./apiClient";
import Cookies from "js-cookie";

const authService = {
  async login(email, password) {
    const response = await apiClient.post(
      "/auth/login/",
      { email, password },
      { _skipAuthToken: true, _skipAuthRefresh: true },
    );
    saveTokenPair(response.data);
    return response.data.user;
  },

  async me() {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  async logout() {
    const refresh = Cookies.get("admin_refresh");
    try {
      if (refresh) {
        await apiClient.post(
          "/auth/logout/",
          { refresh },
          { _skipAuthRefresh: true },
        );
      }
    } finally {
      clearTokenPair();
    }
  },
};

export default authService;
