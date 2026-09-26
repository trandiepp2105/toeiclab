import React from "react";

/**
 * Audio player dùng cho audio từ vựng hoặc audio câu hỏi.
 */
function AudioPlayer({ src, label = "Audio" }) {
  if (!src) {
    return <span className="audio-missing">Không có audio</span>;
  }

  return (
    <audio
      className="audio-player"
      aria-label={label}
      controls
      preload="metadata"
    >
      <source src={src} />
      <span>{label}</span>
    </audio>
  );
}

export default AudioPlayer;
