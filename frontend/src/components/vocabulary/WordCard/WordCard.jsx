import React from "react";

import AudioButton from "../../common/AudioButton/AudioButton";

/**
 * Card hiển thị một từ vựng đầy đủ thông tin học tập.
 */
function WordCard({ word }) {
  return (
    <article className="word-card">
      <div className="word-card-top">
        <span className="level-badge">{word.level || "TOEIC"}</span>
      </div>
      <div className="word-main">
        <div>
          <h3>{word.word}</h3>
          <div className="word-meta">
            <span>{word.part_of_speech}</span>
            <span>/ {word.pronunciation} /</span>
            <AudioButton src={word.audio_word} label="Nghe từ" />
          </div>
          <p className="word-meaning">🇻🇳 &nbsp;{word.meaning_vi}</p>
        </div>
        {word.image && (
          <img
            className="word-image"
            src={word.image}
            alt={word.word}
            loading="lazy"
          />
        )}
      </div>
      <div className="example-row">
        <AudioButton src={word.audio_example} label="Nghe ví dụ" />
        <p>{word.example_en}</p>
      </div>
    </article>
  );
}

export default WordCard;
