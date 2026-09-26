import React from "react";

/**
 * Hiển thị một câu hỏi trong danh sách review quiz từ vựng.
 *
 * @param {Object} question - Câu hỏi đã có đáp án người dùng và đáp án đúng.
 * @param {number} index - Vị trí câu hỏi trong quiz.
 */
function VocabularyReviewItem({ question, index }) {
  const isCorrect = question.is_correct === true;
  const statusLabel = isCorrect ? "Đúng" : "Cần ôn lại";

  return (
    <article className="vocabulary-review-item review-question">
      <div className="review-q-head">
        <b>Câu {index + 1}</b>
        <span className={isCorrect ? "review-correct" : "review-wrong"}>
          {statusLabel}
        </span>
      </div>
      <h3>{question.prompt}</h3>
      <div className="vocabulary-review-answer">
        <span>
          Bạn chọn: <strong>{question.selected_value || "Chưa trả lời"}</strong>
        </span>
        {!isCorrect && (
          <span>
            Đáp án đúng: <strong>{question.correct_value}</strong>
          </span>
        )}
      </div>
      {question.term?.example_en && (
        <p className="vocabulary-review-example">
          Ví dụ: {question.term.example_en}
        </p>
      )}
    </article>
  );
}

export default VocabularyReviewItem;
