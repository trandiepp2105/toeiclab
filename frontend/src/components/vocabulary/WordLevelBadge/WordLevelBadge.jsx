import React from "react";

/**
 * Badge cấp độ của từ vựng.
 */
function WordLevelBadge({ level = "TOEIC" }) {
  return <span className="level-badge">{level}</span>;
}

export default WordLevelBadge;
