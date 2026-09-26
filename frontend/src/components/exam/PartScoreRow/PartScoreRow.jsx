import React from "react";

/**
 * Một dòng điểm theo Part trong kết quả.
 */
function PartScoreRow({
  partNumber,
  title,
  correctCount,
  scoredCount,
  scorePercent,
}) {
  return (
    <div className="score-row">
      <div className="score-part">
        Part {partNumber}
        <small>{title}</small>
      </div>
      <div className="score-meter">
        <span style={{ width: `${scorePercent}%` }} />
      </div>
      <div className="score-value">
        {correctCount}
        <small>/{scoredCount}</small>
      </div>
      <b className="score-percent">{Math.round(scorePercent)}%</b>
    </div>
  );
}

export default PartScoreRow;
