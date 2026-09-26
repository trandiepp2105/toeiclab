import React from "react";

/**
 * Tiến độ câu hỏi hiện tại trong quiz.
 */
function VocabularyQuizProgress({ current, total }) {
  const percentage = total ? (current / total) * 100 : 0;

  return (
    <div className="quiz-progress-top">
      <span>
        Câu {current} / {total}
      </span>
      <span className="progress-line">
        <span style={{ width: `${percentage}%` }} />
      </span>
    </div>
  );
}

export default VocabularyQuizProgress;
