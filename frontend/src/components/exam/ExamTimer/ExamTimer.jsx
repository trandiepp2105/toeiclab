import React from "react";

/**
 * Đồng hồ đếm ngược của full test.
 */
function ExamTimer({ seconds }) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const format = (value) => String(value).padStart(2, "0");

  return (
    <strong className="exam-timer">
      {format(hours)}:{format(minutes)}:{format(remainingSeconds)}
    </strong>
  );
}

export default ExamTimer;
