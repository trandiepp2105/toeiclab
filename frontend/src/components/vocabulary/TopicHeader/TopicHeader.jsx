import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Header của trang chi tiết topic.
 */
function TopicHeader({ topic, onQuiz }) {
  return (
    <div className="topic-header">
      <div>
        <div className="eyebrow">VOCABULARY TOPIC</div>
        <h1>{topic.name}</h1>
        <p>{topic.words?.length || topic.count || 0} từ vựng TOEIC</p>
      </div>
      {onQuiz && (
        <button className="button button-primary" onClick={onQuiz}>
          Làm quiz chủ đề <ArrowIcon />
        </button>
      )}
    </div>
  );
}

export default TopicHeader;
