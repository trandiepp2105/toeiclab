import React from "react";

/**
 * Hiển thị đáp án đúng, giải thích, mẹo và transcript.
 */
function AnswerExplanation({
  isCorrect,
  correctAnswer,
  explanation,
  transcript,
}) {
  return (
    <div
      className={`answer-explanation ${isCorrect ? "is-correct" : "is-wrong"}`}
    >
      <strong>
        {isCorrect ? "Đúng" : "Đáp án"} · {correctAnswer || "Chưa có"}
      </strong>
      {explanation?.reason && <p>{explanation.reason}</p>}
      {explanation?.tip && <small>Mẹo: {explanation.tip}</small>}
      {transcript && (
        <details>
          <summary>Transcript</summary>
          <p>{transcript}</p>
        </details>
      )}
    </div>
  );
}

export default AnswerExplanation;
