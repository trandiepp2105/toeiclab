import React from "react";

/**
 * Một phương án trả lời trong quiz từ vựng.
 */
function VocabularyQuizOption({
  option,
  index,
  selected,
  correct,
  disabled,
  onClick,
}) {
  const status =
    correct === true ? "correct" : correct === false ? "wrong" : "";

  return (
    <button
      className={`quiz-option ${selected ? "chosen" : ""} ${status}`}
      disabled={disabled}
      onClick={() => onClick(option)}
    >
      <span>{String.fromCharCode(65 + index)}</span>
      {option}
    </button>
  );
}

export default VocabularyQuizOption;
