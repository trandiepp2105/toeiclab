import React from "react";

/**
 * Bộ nút chuyển nhanh giữa các câu hỏi.
 */
function QuestionNavigator({
  questions = [],
  currentIndex,
  answers = {},
  onSelect,
}) {
  return (
    <div className="question-number-grid">
      {questions.map((question, index) => (
        <button
          key={question.id}
          className={[
            index === currentIndex && "current",
            answers[question.id] && "answered",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelect(index)}
        >
          {question.number}
        </button>
      ))}
    </div>
  );
}

export default QuestionNavigator;
