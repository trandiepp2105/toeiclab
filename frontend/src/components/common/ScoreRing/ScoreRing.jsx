import React from "react";

/**
 * Vòng điểm phần trăm cho kết quả bài học/bài thi.
 */
function ScoreRing({ value = 0, label = "điểm" }) {
  return (
    <div className="score-ring" aria-label={`${value}% ${label}`}>
      <strong>{value}%</strong>
      <small>{label}</small>
    </div>
  );
}

export default ScoreRing;
