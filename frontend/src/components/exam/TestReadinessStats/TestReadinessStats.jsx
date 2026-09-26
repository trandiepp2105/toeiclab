import React from "react";

/**
 * Hiển thị mức độ sẵn sàng của một đề thi.
 *
 * @param {Object} exam - Dữ liệu đề có answer/audio/image/transcript counts.
 */
function TestReadinessStats({ exam }) {
  const metrics = [
    {
      label: "đáp án",
      value: `${exam?.answer_count || 0}/${exam?.question_count || 0}`,
    },
    {
      label: "câu có audio",
      value: `${exam?.audio_count || 0}/${exam?.question_count || 0}`,
    },
    {
      label: "câu có hình ảnh",
      value: exam?.image_count || 0,
    },
    {
      label: "câu có transcript",
      value: exam?.transcript_count || 0,
    },
  ];

  return (
    <div className="readiness-grid">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <strong>{metric.value}</strong>
          <span> {metric.label}</span>
        </div>
      ))}
    </div>
  );
}

export default TestReadinessStats;
