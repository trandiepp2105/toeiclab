import React from "react";

/**
 * Trạng thái loading dùng cho page hoặc khu vực nội dung.
 */
function LoadingState({ label = "Đang tải dữ liệu…" }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" />
      {label}
    </div>
  );
}

export default LoadingState;
