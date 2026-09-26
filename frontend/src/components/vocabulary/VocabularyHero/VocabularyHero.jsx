import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Hero giới thiệu khu vực học từ vựng.
 */
function VocabularyHero({ onBrowseTopics, onStartQuiz }) {
  return (
    <section className="vocab-banner">
      <div>
        <span className="eyebrow light">LEARN A LITTLE. REMEMBER A LOT.</span>
        <h2>
          Từ mới hôm nay,
          <br />
          điểm số ngày mai.
        </h2>
        <p>Học với thẻ từ trực quan hoặc tự kiểm tra bằng quiz song ngữ.</p>
        <div className="button-row">
          <button className="button button-white" onClick={onBrowseTopics}>
            Học theo chủ đề
          </button>
          <button className="button button-outline" onClick={onStartQuiz}>
            Bắt đầu quiz <ArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

export default VocabularyHero;
