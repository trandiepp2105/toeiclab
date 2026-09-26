import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const historyService = {
  /**
   * Lấy toàn bộ lịch sử học tập.
   */
  getHistory() {
    return getResponseData(apiClient.get("/assessments/history/"));
  },

  /**
   * Lấy lịch sử các bài thi TOEIC.
   */
  getTestHistory() {
    return getResponseData(apiClient.get("/assessments/history/"));
  },

  /**
   * Lấy lịch sử quiz từ vựng.
   */
  getQuizHistory() {
    return getResponseData(apiClient.get("/learning/quizzes/history/"));
  },

  /**
   * Lấy số liệu tổng quan cho dashboard.
   */
  getDashboardStats() {
    return getResponseData(apiClient.get("/learning/progress/"));
  },
};

export default historyService;
