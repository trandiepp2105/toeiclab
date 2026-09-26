import React from "react";

/**
 * Thanh tiến độ có label phần trăm tùy chọn.
 */
function ProgressBar({ value = 0, max = 100, showValue = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="progress-bar" aria-label={`${Math.round(percentage)}%`}>
      <span style={{ width: `${percentage}%` }} />
      {showValue && <small>{Math.round(percentage)}%</small>}
    </div>
  );
}

export default ProgressBar;
