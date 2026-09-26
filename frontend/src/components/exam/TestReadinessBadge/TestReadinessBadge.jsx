import React from "react";

/**
 * Badge mô tả đề đã có đủ đáp án hay chưa.
 */
function TestReadinessBadge({ isComplete }) {
  return (
    <span className={isComplete ? "status-pill" : "status-pill status-warning"}>
      {isComplete ? "✓ Đủ đáp án" : "! Thiếu đáp án"}
    </span>
  );
}

export default TestReadinessBadge;
