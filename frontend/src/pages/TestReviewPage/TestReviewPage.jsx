import React, { useEffect, useState } from "react";
import assessmentService from "../../services/assessmentService";
import { ArrowIcon, Button, Loading, Notice, partNames } from "../../shared/ui";
import "./TestReviewPage.scss";

/**
 * Trang kết quả và review đáp án của một attempt.
 */
function TestReviewPage({ attemptId, go }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  // Review chỉ được tải khi attemptId thay đổi.
  useEffect(() => {
    assessmentService
      .getReview(attemptId)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [attemptId]);
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <Notice error={error} />
        <Button kind="outline" onClick={() => go("/tests")}>
          Về danh sách đề
        </Button>
      </>
    );
  const attempt = result.attempt;
  const isFullTest = attempt.mode === "full";
  const totalQuestionCount = attempt.questions.length;
  const correctAnswerCount = attempt.questions.filter(
    (question) => question.is_correct === true,
  ).length;
  const answeredQuestionCount = attempt.questions.filter(
    (question) => Boolean(question.selected_answer),
  ).length;
  const incorrectAnswerCount = answeredQuestionCount - correctAnswerCount;
  const skippedQuestionCount = totalQuestionCount - answeredQuestionCount;
  const qs = attempt.questions.filter(
    (q) =>
      filter === "all" ||
      (filter === "wrong" ? q.is_correct === false : !q.selected_answer),
  );
  const questionsByPart = result.part_scores
    .map((part) => ({
      part,
      questions: qs.filter((question) => question.part_number === part.part_number),
    }))
    .filter(({ questions }) => questions.length > 0);
  return (
    <>
      <div className="back-row">
        <button className="text-button" onClick={() => go("/history")}>
          <ArrowIcon direction="left" /> Lịch sử làm bài
        </button>
        <span>KẾT QUẢ THI</span>
      </div>
      <section className={`result-hero ${isFullTest ? "result-hero-full" : ""}`}>
        {!isFullTest && <span className="result-medal">✦</span>}
        <div className="eyebrow light">TEST COMPLETED</div>
        <h1>{attempt.exam.title}</h1>
        <p>
          {isFullTest ? "Bài thi đầy đủ" : "Luyện tập theo Part"} ·{" "}
          {new Date(attempt.submitted_at).toLocaleString("vi-VN")}
        </p>
        {isFullTest && result.toeic_score ? (
          <>
            <div className="result-summary-grid">
              <div className="result-metric result-metric-correct">
                <span aria-hidden="true">✓</span>
                <small>Trả lời đúng</small>
                <b>{correctAnswerCount}</b>
                <small>câu hỏi</small>
              </div>
              <div className="result-metric result-metric-incorrect">
                <span aria-hidden="true">×</span>
                <small>Trả lời sai</small>
                <b>{incorrectAnswerCount}</b>
                <small>câu hỏi</small>
              </div>
              <div className="result-metric result-metric-skipped">
                <span aria-hidden="true">−</span>
                <small>Bỏ qua</small>
                <b>{skippedQuestionCount}</b>
                <small>câu hỏi</small>
              </div>
              <div className="result-metric result-metric-total">
                <span aria-hidden="true">⚑</span>
                <small>Điểm TOEIC</small>
                <b>{result.toeic_score.total_score}</b>
                <small>/ 990</small>
              </div>
            </div>
            <div className="result-section-scores">
              {[
                ["Listening", result.toeic_score.listening],
                ["Reading", result.toeic_score.reading],
              ].map(([section, score]) => (
                <div className="result-section-score" key={section}>
                  <div>
                    <b>{section}</b>
                    <strong>{score.score}<small> / 495</small></strong>
                  </div>
                  <span>
                    Trả lời đúng: {score.correct_count}/{score.scored_count}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="result-stats">
            {result.toeic_score && (
              <div>
                <b>{result.toeic_score.total_score}</b>
                <small>điểm TOEIC ước tính</small>
              </div>
            )}
            <div>
              <b>{result.part_scores.reduce((a, x) => a + x.correct_count, 0)}</b>
              <small>câu đúng</small>
            </div>
            <div>
              <b>{result.part_scores.reduce((a, x) => a + x.scored_count, 0)}</b>
              <small>câu có đáp án</small>
            </div>
            <div>
              <b>
                {Math.round(
                  result.part_scores.reduce((a, x) => a + x.score_percent, 0) /
                    Math.max(1, result.part_scores.length),
                )}
                %
              </b>
              <small>độ chính xác</small>
            </div>
          </div>
        )}
      </section>
      <div className="result-layout">
        <section className="panel scores-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">YOUR PERFORMANCE</div>
              <h2>Kết quả theo Part</h2>
            </div>
            <Button
              kind="outline"
              onClick={() =>
                go(`/tests/${attempt.exam.slug}/review/${attempt.id}`)
              }
            >
              Xem lại câu hỏi ↓
            </Button>
          </div>
          {result.part_scores.map((row) => (
            <div className="score-row" key={row.part_number}>
              <div className="score-part">
                Part {row.part_number}
                <small>{partNames[row.part_number - 1]}</small>
              </div>
              <div className="score-meter">
                <span style={{ width: `${row.score_percent}%` }} />
              </div>
              <div className="score-value">
                {row.correct_count}
                <small>/{row.scored_count}</small>
              </div>
              <b className="score-percent">{Math.round(row.score_percent)}%</b>
            </div>
          ))}
        </section>
        <aside className="panel review-aside">
          <div className="eyebrow">NEXT STEP</div>
          <h3>Ôn lại câu trả lời</h3>
          <p>Đọc lời giải và mẹo cho từng câu để biến lỗi sai thành điểm số.</p>
          <Button
            onClick={() => go(`/tests/${attempt.exam.slug}/review/${attempt.id}`)}
          >
            Bắt đầu xem lại <ArrowIcon />
          </Button>
          <button className="text-button" onClick={() => go("/tests")}>
            Chọn đề khác
          </button>
        </aside>
      </div>
      <section className="panel review-list">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">ANSWER REVIEW</div>
            <h2>Đáp án và giải thích</h2>
          </div>
          <div className="filter-tabs">
            {[
              ["all", "Tất cả"],
              ["wrong", "Câu sai"],
              ["blank", "Bỏ trống"],
            ].map(([v, l]) => (
              <button
                className={filter === v ? "active" : ""}
                key={v}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {questionsByPart.map(({ part, questions }) => (
          <details className="review-part" key={part.part_number}>
            <summary className="review-part-summary">
              <span className="review-part-title">
                <b>Part {part.part_number} · {partNames[part.part_number - 1]}</b>
                <small>{questions.length} câu</small>
              </span>
              <span className="review-part-toggle" aria-hidden="true">⌄</span>
            </summary>
            <div className="review-part-questions">
              {questions.map((item) => (
                <article className="review-question" key={item.id}>
                  <div className="review-q-head">
                    <b>
                      Câu {item.number} · Part {item.part_number}
                    </b>
                    <span
                      className={
                        item.is_correct
                          ? "review-correct"
                          : item.selected_answer
                            ? "review-wrong"
                            : "review-empty"
                      }
                    >
                      {item.is_correct
                        ? "✓ Chính xác"
                        : item.selected_answer
                          ? "✕ Chưa chính xác"
                          : "Chưa trả lời"}
                    </span>
                  </div>
                  <p>{item.question}</p>
                  {item.image_files?.map((src) => (
                    <img className="review-image" src={src} alt="" key={src} />
                  ))}
                  <div className="review-options">
                    {Object.entries(item.options || {}).map(([key, text]) => (
                      <span
                        className={`${key === item.correct_answer ? "right-answer" : ""} ${key === item.selected_answer && !item.is_correct ? "wrong-answer" : ""}`}
                        key={key}
                      >
                        <b>{key}.</b> {text}
                      </span>
                    ))}
                  </div>
                  <div className="review-explanation">
                    <b>Đáp án {item.correct_answer || "chưa có"}</b>
                    <p>
                      {item.explanation?.reason || "Chưa có giải thích cho câu này."}
                    </p>
                    {item.explanation?.tip && (
                      <small>✦ Mẹo: {item.explanation.tip}</small>
                    )}
                    {item.transcript && (
                      <details>
                        <summary>Transcript</summary>
                        <p>{item.transcript}</p>
                      </details>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </details>
        ))}
        {questionsByPart.length === 0 && (
          <p className="muted center">Không có câu hỏi phù hợp với bộ lọc.</p>
        )}
      </section>
    </>
  );
}

export default TestReviewPage;
