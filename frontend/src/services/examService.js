import apiClient from "./apiClient";

/**
 * Lấy data từ Axios response.
 */
const getResponseData = (request) => {
  return request.then((response) => response.data);
};

const examService = {
  /**
   * Lấy danh sách đề thi.
   *
   * @param {string} answers - Bộ lọc trạng thái trả lời: complete/incomplete.
   */
  listExams(answers = "") {
    const params = {
      page_size: 100,
    };

    if (answers) {
      params.answers = answers;
    }

    return getResponseData(apiClient.get("/content/exams/", { params }));
  },

  /**
   * Lấy chi tiết một đề thi theo slug URL.
   */
  getExam(slug) {
    return getResponseData(apiClient.get(`/content/exams/${slug}/`));
  },

  /**
   * Lấy đáp án, giải thích và transcript của toàn bộ đề thi.
   * Endpoint chỉ đọc ngân hàng đề, không tạo hoặc yêu cầu nộp attempt.
   */
  getExamAnswerTranscript(slug) {
    return getResponseData(
      apiClient.get(`/content/exams/${slug}/answers-transcripts/`),
    );
  },

  /**
   * Lấy các part thuộc một đề thi.
   */
  listExamParts(slug) {
    return getResponseData(apiClient.get(`/content/exams/${slug}/parts/`));
  },

  /**
   * Lấy chi tiết một part trong đề thi.
   */
  getExamPart(examSlug, partId) {
    return getResponseData(
      apiClient.get(`/content/exams/${examSlug}/parts/${partId}/`),
    );
  },

  /**
   * Lấy chi tiết một câu hỏi.
   */
  getQuestion(id) {
    return getResponseData(apiClient.get(`/content/questions/${id}/`));
  },
};

export default examService;
