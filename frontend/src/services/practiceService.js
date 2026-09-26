import apiClient from "./apiClient";

/** Chuyển Axios response thành payload API. */
const getResponseData = (request) =>
  request.then((response) => response.data);

const practiceService = {
  /** Lấy cấu hình và số câu hỏi của bảy Part luyện tập. */
  listParts() {
    return getResponseData(apiClient.get("/content/practice/parts/"));
  },

  /** Lấy toàn bộ câu hỏi của một Part, đã sắp xếp theo năm đề giảm dần. */
  getPartQuestions(partNumber) {
    return getResponseData(
      apiClient.get(`/content/practice/parts/${partNumber}/questions/`),
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
