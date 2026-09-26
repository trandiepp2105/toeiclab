import React from "react";

/**
 * Trạng thái lỗi có nút thử lại tùy chọn.
 */
function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state notice notice-error" role="alert">
      <p>{message || "Đã xảy ra lỗi. Vui lòng thử lại."}</p>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export default ErrorState;
