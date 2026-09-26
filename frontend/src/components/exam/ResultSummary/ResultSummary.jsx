import React from "react";

import ScoreRing from "../../common/ScoreRing/ScoreRing";

/**
 * Tóm tắt điểm tổng quan của một attempt.
 */
function ResultSummary({ percentage, correctCount, scoredCount, title }) {
  return (
    <section className="result-hero">
      <ScoreRing value={Math.round(percentage)} label="độ chính xác" />
      <div className="eyebrow light">TEST COMPLETED</div>
      <h1>{title}</h1>
      <div className="result-stats">
        <div>
          <b>{correctCount}</b>
          <small>câu đúng</small>
        </div>
        <div>
          <b>{scoredCount}</b>
          <small>câu có đáp án</small>
        </div>
      </div>
    </section>
  );
}

export default ResultSummary;
