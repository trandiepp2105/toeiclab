import React from "react";

/**
 * Chọn phạm vi quiz: toàn bộ, theo topic hoặc từ cần ôn.
 */
function QuizScopeSelector({
  value,
  onChange,
  topics = [],
  topicId,
  onTopicChange,
}) {
  const scopes = [
    ["all", "Tất cả từ", "Ôn tập ngẫu nhiên trong bộ từ vựng"],
    ["topic", "Theo chủ đề", "Tập trung vào một chủ đề cụ thể"],
    ["review", "Từ cần ôn", "Ưu tiên những từ thường trả lời sai"],
  ];

  return (
    <div className="quiz-scope-selector">
      <div className="choice-list">
        {scopes.map(([scope, title, description]) => (
          <label
            className={`choice-row ${value === scope ? "selected" : ""}`}
            key={scope}
          >
            <input
              type="radio"
              checked={value === scope}
              onChange={() => onChange(scope)}
            />
            <span>
              <b>{title}</b>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </div>

      {value === "topic" && (
        <select value={topicId} onChange={onTopicChange}>
          <option value="">Chọn chủ đề…</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default QuizScopeSelector;
