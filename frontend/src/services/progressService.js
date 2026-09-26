import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const progressService = {
  /**
   * Lấy tổng quan tiến độ học tập.
   */
  getOverview() {
    return getResponseData(apiClient.get("/learning/progress/"));
  },

  /**
   * Lấy tiến độ học từ vựng.
   */
  getVocabularyProgress() {
    return getResponseData(apiClient.get("/learning/progress/"));
  },

};

export default progressService;
