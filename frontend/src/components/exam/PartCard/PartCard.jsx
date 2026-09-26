import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Card bắt đầu luyện một Part.
 */
function PartCard({
  partNumber,
  title,
  type,
  questionCount,
  onStart,
  disabled,
}) {
  return (
    <article className="part-choice-card">
      <span className={`part-number pn-${partNumber}`}>
        {String(partNumber).padStart(2, "0")}
      </span>
      <div className="eyebrow">{type}</div>
      <h3>Part {partNumber}</h3>
      <p>{title}</p>
      <small>{questionCount} câu hỏi</small>
      <button
        className="button button-outline"
        disabled={disabled}
        onClick={onStart}
      >
        Luyện Part {partNumber} <ArrowIcon />
      </button>
    </article>
  );
}

export default PartCard;
