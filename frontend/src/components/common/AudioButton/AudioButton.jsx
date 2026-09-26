import React, { useEffect, useRef, useState } from "react";

/**
 * Nút phát audio cho từ vựng hoặc câu hỏi.
 */
function AudioButton({ src, label }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);

    if (!src) return undefined;

    const audio = new Audio(src);
    audio.preload = "none";

    const handlePlaybackStarted = () => setIsPlaying(true);
    const handlePlaybackStopped = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlaybackStarted);
    audio.addEventListener("pause", handlePlaybackStopped);
    audio.addEventListener("ended", handlePlaybackStopped);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlaybackStarted);
      audio.removeEventListener("pause", handlePlaybackStopped);
      audio.removeEventListener("ended", handlePlaybackStopped);
      audio.pause();

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [src]);

  /** Toggle the pronunciation and reset it to the beginning when stopped. */
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
    } catch (_) {
      // Keep the button in the stopped state if the browser cannot play audio.
      setIsPlaying(false);
    }
  };

  return src ? (
    <button
      className={`audio-button ${isPlaying ? "is-playing" : ""}`}
      type="button"
      title={isPlaying ? `Dừng ${label.toLowerCase()}` : label}
      aria-label={isPlaying ? `Dừng ${label.toLowerCase()}` : label}
      aria-pressed={isPlaying}
      onClick={togglePlayback}
    >
      {isPlaying ? "■" : "▶"}
    </button>
  ) : (
    <span className="audio-missing" title="Không có audio">
      ◌
    </span>
  );
}

export default AudioButton;
