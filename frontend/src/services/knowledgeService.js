import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const knowledgeService = {
  /**
   * Lấy danh sách ghi chú ngữ pháp.
   */
  listGrammarNotes() {
    return getResponseData(apiClient.get("/knowledge/grammar/"));
  },

  /**
   * Lấy chi tiết một ghi chú ngữ pháp.
   */
  getGrammarNote(id) {
    return getResponseData(apiClient.get(`/knowledge/grammar/${id}/`));
  },

  /**
   * Lấy danh sách mẹo làm bài theo part.
   */
  listPartTips() {
    return getResponseData(apiClient.get("/knowledge/part-tips/"));
  },

  /**
   * Lấy danh sách bài viết kiến thức.
   */
  listArticles() {
    return getResponseData(apiClient.get("/knowledge/articles/"));
  },
};

export default knowledgeService;
