import React from "react";

/**
 * Một lựa chọn đáp án của câu hỏi TOEIC.
 */
function AnswerOption({
  optionKey,
  text,
  selected,
  correct,
  wrong,
  disabled,
  onSelect,
}) {
  return (
    <button
      className={[
        "run-option",
        selected && "selected",
        correct && "right-answer",
        wrong && "wrong-answer",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={() => onSelect(optionKey)}
    >
      <span>{optionKey}</span>
      <b>{text}</b>
    </button>
  );
}

export default AnswerOption;
