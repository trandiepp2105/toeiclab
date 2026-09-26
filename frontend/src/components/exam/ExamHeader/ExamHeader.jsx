import React from "react";

/**
 * Header cố định trong màn hình làm bài.
 */
function ExamHeader({
  title,
  modeLabel,
  timeText,
  fullscreen,
  onFullscreen,
  onSubmit,
  submitting = false,
}) {
  return (
    <header className="exam-header">
      <button className="exam-brand" onClick={onSubmit}>
        <img className="brand-logo" src="/logo.jpeg" alt="TOEICLab" />
        <span>
          <b>
            <span className="brand-word-toeic">TOEIC</span>
            <span className="brand-word-lab">Lab</span>
          </b>
          <small>
            {title} · {modeLabel}
          </small>
        </span>
      </button>
      <div className="exam-header-status">
        <span className="saving-status">● Tiến độ được lưu</span>
        {timeText && <strong className="exam-timer">{timeText}</strong>}
        <button className="exam-tool" onClick={onFullscreen}>
          ⛶ {fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        </button>
        <button
          className="button button-danger"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? "Đang nộp…" : "Nộp bài"}
        </button>
      </div>
    </header>
  );
}

export default ExamHeader;
