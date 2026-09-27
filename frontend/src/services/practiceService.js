import apiClient from "./apiClient";

/** Chuyển Axios response thành payload API. */
const getResponseData = (request) =>
  request.then((response) => response.data);

const practiceService = {
  /** Lấy cấu hình và số câu hỏi của bảy Part luyện tập. */
  listParts() {
    return getResponseData(apiClient.get("/content/practice/parts/"));
  },

  /** Lấy cửa sổ câu hỏi quanh vị trí đã lưu hoặc trước/sau một cursor. */
  getPartQuestions(partNumber, { cursor, direction = "around" } = {}) {
    return getResponseData(
      apiClient.get(`/content/practice/parts/${partNumber}/questions/`, {
        params: { ...(cursor ? { cursor } : {}), direction },
      }),
    );
  },

  /** Lưu câu hỏi đầu cụm tại đó người dùng dừng lại. */
  savePartProgress(partNumber, questionId) {
    return getResponseData(
      apiClient.patch(`/content/practice/parts/${partNumber}/progress/`, {
        question_id: questionId,
      }),
    );
  },

  /** Chấm một câu đơn hoặc toàn bộ đáp án của một cụm câu. */
  checkAnswers(answers) {
    return getResponseData(
      apiClient.post("/content/practice/check/", { answers }),
    ).then((result) => {
      window.dispatchEvent(new Event("toeiclab:study-activity"));
      return result;
    });
  },
};

export default practiceService;
