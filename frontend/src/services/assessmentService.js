import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const assessmentService = {
  /**
   * Tạo một lượt làm bài mới.
   *
   * @param {Object} payload - exam_id, mode, selected_parts và giới hạn thời gian.
   */
  startAttempt(payload) {
    return getResponseData(apiClient.post("/assessments/attempts/", payload));
  },

  /**
   * Lấy dữ liệu lượt làm bài.
   */
  getAttempt(id) {
    return getResponseData(apiClient.get(`/assessments/attempts/${id}/`));
  },

  /** Bắt đầu đồng hồ full test ở backend sau khi người dùng đọc directions. */
  startFullTest(id) {
    return getResponseData(
      apiClient.post(`/assessments/attempts/${id}/start/`, {}),
    );
  },

  /** Save the zero-based question position of a resumable full-test session. */
  saveProgress(id, currentQuestionIndex) {
    return getResponseData(
      apiClient.put(`/assessments/attempts/${id}/progress/`, {
        current_question_index: currentQuestionIndex,
      }),
    );
  },

  /**
   * Lưu một hoặc nhiều đáp án của lượt làm bài.
   *
   * @param {number|string} id - ID lượt làm bài.
   * @param {Object} answers - Map question ID và đáp án.
   * @param {boolean} check - Có chấm ngay đáp án hay không.
   */
  saveAnswers(id, answers, check = false) {
    return getResponseData(
      apiClient.put(`/assessments/attempts/${id}/answers/`, {
        answers,
        check,
      }),
    ).then((result) => {
      if (Object.keys(answers || {}).length > 0) {
        window.dispatchEvent(new Event("toeiclab:study-activity"));
      }
      return result;
    });
  },

  /**
   * Lưu một đáp án đơn lẻ.
   */
  saveAnswer(id, questionId, answer) {
    return getResponseData(
      apiClient.put(`/assessments/attempts/${id}/answers/`, {
        answers: {
          [questionId]: answer,
        },
      }),
    );
  },

  /**
   * Nộp lượt làm bài.
   */
  submitAttempt(id) {
    return getResponseData(apiClient.post(`/assessments/attempts/${id}/submit/`, {}));
  },

  /**
   * Lấy kết quả tổng hợp của lượt làm bài.
   */
  getResult(id) {
    return getResponseData(
      apiClient.get(`/assessments/attempts/${id}/result/`),
    );
  },

  /**
   * Lấy dữ liệu review gồm đáp án, giải thích và điểm.
   */
  getReview(id) {
    return getResponseData(
      apiClient.get(`/assessments/attempts/${id}/review/`),
    );
  },

  /**
   * Bỏ lượt làm bài đang diễn ra.
   */
  abandonAttempt(id) {
    return getResponseData(
      apiClient.post(`/assessments/attempts/${id}/abandon/`, {}),
    );
  },
};

export default assessmentService;
