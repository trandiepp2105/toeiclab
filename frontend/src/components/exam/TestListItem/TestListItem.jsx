import React from "react";

/**
 * Một dòng/card đề thi trong thư viện.
 */
function TestListItem({ exam, onSelect }) {
  return (
    <article
      className={`test-card ${exam.has_attempted ? "test-card-completed" : "test-card-not-started"}`}
    >
      <div className="test-card-body">
        <h3>{exam.title}</h3>
        <div className="test-card-info">
          <span>◷ 120 phút</span>
          <span>|</span>
          <span>◉ {exam.answer_count || 0}</span>
          <span>|</span>
          <span>▱ {exam.question_count || 0}</span>
        </div>
        <strong className="test-card-summary">
          {exam.parts?.length || 7} phần thi | {exam.question_count || 0} câu hỏi
        </strong>
        <span className="test-card-tag">#TOEIC</span>
        <button className="test-detail-button" onClick={onSelect}>
          Chi tiết
        </button>
      </div>
    </article>
  );
}

export default TestListItem;
