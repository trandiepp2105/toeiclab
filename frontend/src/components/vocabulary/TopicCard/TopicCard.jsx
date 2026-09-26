import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Card đại diện cho một chủ đề từ vựng.
 */
function TopicCard({ topic, index = 0, onClick }) {
  return (
    <button className="topic-card" onClick={onClick}>
      <span className={`topic-art art-${index % 6}`}>
        <span>{["◈", "▧", "✦", "⌂", "◎", "◌"][index % 6]}</span>
        <small>{String(topic.count || 0).padStart(2, "0")} WORDS</small>
      </span>
      <span className="topic-info">
        <b>{topic.name}</b>
        <small>{topic.count || 0} từ vựng</small>
        <span className="topic-link">
          Khám phá chủ đề <ArrowIcon direction="up-right" />
        </span>
      </span>
    </button>
  );
}

export default TopicCard;
