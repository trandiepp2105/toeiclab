import React from "react";

/**
 * Checkbox selector các Part trong chế độ làm bài tùy chỉnh.
 */
function PartSelector({ parts = [], selectedParts = [], onToggle }) {
  return (
    <div className="part-check-grid">
      {parts.map((part) => (
        <label
          className={`part-check ${selectedParts.includes(part.number) ? "checked" : ""}`}
          key={part.number}
        >
          <input
            type="checkbox"
            checked={selectedParts.includes(part.number)}
            onChange={() => onToggle(part.number)}
          />
          <b>Part {part.number}</b>
          <small>{part.name || part.title}</small>
          <span>{part.question_count} câu</span>
        </label>
      ))}
    </div>
  );
}

export default PartSelector;
