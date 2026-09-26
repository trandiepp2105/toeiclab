import React from "react";

import PartCard from "../PartCard/PartCard";

/**
 * Grid 7 Part của bài thi.
 */
function PartGrid({ parts = [], onStart, disabled = false }) {
  return (
    <div className="part-choice-grid">
      {parts.map((part) => (
        <PartCard
          key={part.number}
          partNumber={part.number}
          title={part.name || part.title}
          type={part.number <= 4 ? "LISTENING" : "READING"}
          questionCount={part.question_count}
          disabled={disabled}
          onStart={() => onStart(part.number)}
        />
      ))}
    </div>
  );
}

export default PartGrid;
