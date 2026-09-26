import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const quizService = {
  /**
   * Tạo bài kiểm tra từ vựng.
   *
   * @param {Object} payload - Phạm vi, chủ đề, số câu và dạng câu hỏi.
   */
  createVocabularyQuiz(payload) {
    return getResponseData(apiClient.post("/learning/quizzes/", payload));
  },

  /**
   * Lấy dữ liệu bài kiểm tra từ vựng.
   */
  getVocabularyQuiz(id) {
    return getResponseData(apiClient.get(`/learning/quizzes/${id}/`));
  },

  /**
   * Gửi đáp án cho một câu hỏi từ vựng.
   */
  submitVocabularyAnswer(id, position, selected_value) {
    return getResponseData(
      apiClient.post(`/learning/quizzes/${id}/answers/`, {
        position,
        selected_value,
      }),
    ).then((result) => {
      window.dispatchEvent(new Event("toeiclab:study-activity"));
      return result;
    });
  },

  /**
   * Lấy kết quả bài kiểm tra từ vựng.
   */
  getVocabularyQuizResult(id) {
    return getResponseData(apiClient.get(`/learning/quizzes/${id}/result/`));
  },
};

export default quizService;
