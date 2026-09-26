import apiClient from "./apiClient";

/** Lấy dữ liệu thống kê đã được backend tổng hợp cho dashboard. */
const dashboardService = {
  getSummary() {
    return apiClient.get("/dashboard/summary/").then((response) => response.data);
  },

  /** Lấy streak từ những hoạt động học đã được backend lưu lại. */
  getStudyStreak() {
    return apiClient.get("/learning/streak/").then((response) => response.data);
  },
};

export default dashboardService;
