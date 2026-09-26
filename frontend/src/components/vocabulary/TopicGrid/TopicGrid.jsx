import React from "react";

import TopicCard from "../TopicCard/TopicCard";

/**
 * Grid danh sách chủ đề từ vựng.
 */
function TopicGrid({ topics = [], onSelect }) {
  return (
    <div className="topic-grid">
      {topics.map((topic, index) => (
        <TopicCard
          key={topic.slug || topic.id}
          topic={topic}
          index={index}
          onClick={() => onSelect(topic)}
        />
      ))}
    </div>
  );
}

export default TopicGrid;
