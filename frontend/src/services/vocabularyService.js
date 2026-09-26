import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const vocabularyService = {
  /**
   * Lấy danh sách chủ đề từ vựng.
   */
  listTopics() {
    return getResponseData(apiClient.get("/vocabulary/topics/"));
  },

  /**
   * Lấy chi tiết một chủ đề và các từ vựng thuộc chủ đề.
   */
  getTopic(slug) {
    return getResponseData(apiClient.get(`/vocabulary/topics/${slug}/`));
  },

  /**
   * Tìm kiếm danh sách từ vựng.
   *
   * @param {string} query - Từ khóa tìm kiếm.
   */
  listTerms(query = "") {
    const params = query ? { q: query } : {};

    return getResponseData(apiClient.get("/vocabulary/terms/", { params }));
  },

  /**
   * Lấy chi tiết một từ vựng.
   */
  getTerm(id) {
    return getResponseData(apiClient.get(`/vocabulary/terms/${id}/`));
  },
};

export default vocabularyService;
