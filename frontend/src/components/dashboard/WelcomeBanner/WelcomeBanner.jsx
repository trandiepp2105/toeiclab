import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Hero banner giới thiệu lộ trình học và CTA chính.
 */
function WelcomeBanner({
  user,
  onStartLearning,
  onContinueTest,
  hasActiveTest,
}) {
  const name = user?.display_name || "bạn";

  return (
    <section className="hero-panel welcome-banner">
      <div className="hero-copy">
        <div className="eyebrow light">YOUR NEXT SCORE STARTS HERE</div>
        <h1>
          {user ? `Chào ${name},` : "Chào mừng đến TOEICLab"}
          <br />
          <em>sẵn sàng bứt phá?</em>
        </h1>
        <p>
          Học từ vựng theo chủ đề, luyện từng Part và chinh phục bài thi TOEIC
          hoàn chỉnh.
        </p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onStartLearning}>
            Bắt đầu học <ArrowIcon />
          </button>
          <button className="hero-link" onClick={onContinueTest}>
            {hasActiveTest ? "Tiếp tục bài thi" : "Khám phá đề thi"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default WelcomeBanner;
