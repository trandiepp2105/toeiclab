import React from "react";

/**
 * Sidebar điều hướng câu hỏi theo Part.
 */
function ExamSidebar({
  questions = [],
  currentIndex,
  answers = {},
  partNames = [],
  onSelect,
  heading = "Danh sách câu hỏi",
  metaText,
  className = "",
}) {
  return (
    <aside className={`exam-sidebar ${className}`.trim()}>
      <div className="exam-sidebar-heading">
        <b>{heading}</b>
        <small>{metaText || `${Object.keys(answers).length} / ${questions.length} đã làm`}</small>
      </div>
      {partNames.map((partName, index) => {
        const partNumber = index + 1;
        const partQuestions = questions.filter(
          (question) => question.part_number === partNumber,
        );

        return (
          <div className="exam-part-nav" key={partNumber}>
            <div className="exam-part-title">
              Part {partNumber}
              <small>{partName}</small>
            </div>
            <div className="question-number-grid">
              {partQuestions.map((question) => {
                const questionIndex = questions.findIndex(
                  (item) => item.id === question.id,
                );

                return (
                  <button
                    type="button"
                    key={question.id}
                    aria-label={`Mở đáp án câu ${question.number}, Part ${partNumber}`}
                    aria-current={questionIndex === currentIndex ? "true" : undefined}
                    className={[
                      questionIndex === currentIndex && "current",
                      answers[question.id] && "answered",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelect(questionIndex)}
                  >
                    {question.number}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

export default ExamSidebar;
