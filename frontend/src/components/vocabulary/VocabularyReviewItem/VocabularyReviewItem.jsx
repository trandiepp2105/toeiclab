import React from "react";

/**
 * Hiển thị một câu hỏi trong danh sách review quiz từ vựng.
 *
 * @param {Object} question - Câu hỏi đã có đáp án người dùng và đáp án đúng.
 * @param {number} index - Vị trí câu hỏi trong quiz.
 */
function VocabularyReviewItem({ question, index }) {
  const isCorrect = question.is_correct === true;
  const isSkipped = !question.selected_value;
  const statusLabel = isCorrect ? "Đúng" : isSkipped ? "Bỏ qua" : "Cần ôn lại";
  const statusClass = isCorrect
    ? "review-correct"
    : isSkipped
      ? "review-unanswered"
      : "review-wrong";

  return (
    <article className="vocabulary-review-item review-question">
      <div className="review-q-head">
        <b>Câu {index + 1}</b>
        <span className={statusClass}>{statusLabel}</span>
      </div>
      <h3>{question.prompt}</h3>
      <div className="vocabulary-review-options" role="list" aria-label={`Các lựa chọn câu ${index + 1}`}>
        {(question.options || []).map((option, optionIndex) => {
          const isChosen = option === question.selected_value;
          const isAnswer = option === question.correct_value;
          const optionClass = [
            "vocabulary-review-option",
            isAnswer && "is-answer",
            isChosen && !isAnswer && "is-chosen-wrong",
          ].filter(Boolean).join(" ");

          return (
            <div
              className={optionClass}
              key={`${question.position}-${optionIndex}`}
              role="listitem"
            >
              <span className="vocabulary-review-option-key" aria-hidden="true">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="vocabulary-review-option-text">{option}</span>
              <span className="vocabulary-review-option-label">
                {isAnswer && isChosen
                  ? "Lựa chọn của bạn · Đáp án đúng"
                  : isAnswer
                    ? "Đáp án đúng"
                    : isChosen
                      ? "Bạn đã chọn"
                      : ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`vocabulary-review-feedback ${isCorrect ? "is-correct" : isSkipped ? "is-skipped" : "is-wrong"}`}>
        {isCorrect
          ? "Chính xác!"
          : isSkipped
            ? `Bạn chưa trả lời. Đáp án đúng: ${question.correct_value}`
            : `Chưa chính xác. Bạn chọn: ${question.selected_value}. Đáp án đúng: ${question.correct_value}.`}
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
