import React from "react";

import WordCard from "../WordCard/WordCard";

/**
 * Grid các word card của một chủ đề.
 */
function WordGrid({ words = [] }) {
  return (
    <div className="word-grid">
      {words.map((word) => (
        <WordCard key={word.id} word={word} />
      ))}
    </div>
  );
}

export default WordGrid;
