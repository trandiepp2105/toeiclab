import React from "react";

/**
 * Tóm tắt đề thi trước khi bắt đầu.
 */
function TestSummary({ exam }) {
  return (
    <div className="test-detail-head">
      <div>
        <span className="eyebrow">TOEIC TEST</span>
        <h2>{exam.title}</h2>
        <p>{exam.question_count} câu hỏi</p>
      </div>
      <span className="status-pill">
        {exam.answers_complete ? "✓ Đủ đáp án" : "! Thiếu đáp án"}
      </span>
    </div>
  );
}

export default TestSummary;
