import React, { useEffect, useState } from "react";

import "./VocabularyQuizResultPage.scss";
import VocabularyReviewItem from "../../components/vocabulary/VocabularyReviewItem/VocabularyReviewItem";
import quizService from "../../services/quizService";
import { ArrowIcon, Button, Loading } from "../../shared/ui";

const getQuizErrorMessage = (error) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error.message ||
    "Không thể tải kết quả quiz."
  );
};

/**
 * Trang kết quả quiz từ vựng.
 *
 * Trang này tải lại dữ liệu từ API để đảm bảo kết quả vẫn hiển thị đúng
 * khi người dùng refresh trình duyệt hoặc mở lại từ lịch sử.
 */
function VocabularyQuizResultPage({ attemptId, go }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setLoading(true);
    setError("");
    quizService
      .getVocabularyQuizResult(attemptId)
      .then((result) => {
        if (isCurrentRequest) setQuiz(result);
      })
      .catch((requestError) => {
        if (isCurrentRequest) setError(getQuizErrorMessage(requestError));
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [attemptId, reloadCount]);

  if (loading) {
    return <Loading />;
  }

  if (error || !quiz) {
    return (
      <section className="panel vocabulary-result-error">
        <span className="vocabulary-result-error-icon" aria-hidden="true">!</span>
        <div>
          <div className="eyebrow">QUIZ RESULT</div>
          <h1>Chưa tải được kết quả</h1>
          <p>{error || "Không tìm thấy kết quả quiz."}</p>
        </div>
        <div className="button-row">
          <Button kind="outline" onClick={() => setReloadCount((count) => count + 1)}>
            Thử lại
          </Button>
          <Button onClick={() => go("/vocabulary/quiz")}>Tạo quiz mới</Button>
        </div>
      </section>
    );
  }

  const totalCount = Math.max(quiz.question_count || 0, 0);
  const correctCount = Math.max(quiz.correct_count || 0, 0);
  const answeredCount = Math.max(quiz.answered_count || 0, correctCount);
  const incorrectCount = Math.max(answeredCount - correctCount, 0);
  const skippedCount = Math.max(totalCount - answeredCount, 0);
  const scorePercent = totalCount
    ? Math.round((correctCount / totalCount) * 100)
    : 0;
  const scopeLabel = {
    all: "Tất cả từ vựng",
    topic: "Theo chủ đề",
    review: "Từ cần ôn lại",
  }[quiz.scope] || "Bài kiểm tra từ vựng";

  return (
    <>
      <div className="back-row">
        <button className="text-button" onClick={() => go("/vocabulary/quiz")}>
          <ArrowIcon direction="left" /> Tạo quiz mới
        </button>
        <span>VOCABULARY QUIZ RESULT</span>
      </div>

      <section className="panel vocabulary-result-hero">
        <div className="vocabulary-result-heading">
          <div className="eyebrow">{scopeLabel} · KẾT QUẢ</div>
          <h1>Hoàn thành bài kiểm tra!</h1>
          <p>Bạn đã trả lời {answeredCount} trên {totalCount} câu hỏi.</p>
        </div>

        <div className="vocabulary-result-summary">
          <div
            className="vocabulary-result-score-ring"
            style={{ "--score-progress": `${scorePercent}%` }}
            role="img"
            aria-label={`${scorePercent}% chính xác`}
          >
            <div>
              <strong>{scorePercent}%</strong>
              <span>chính xác</span>
            </div>
          </div>

          <div className="vocabulary-result-stats">
            <article className="vocabulary-result-stat is-correct">
              <span className="vocabulary-result-stat-icon" aria-hidden="true">✓</span>
              <span>Trả lời đúng</span>
              <strong>{correctCount}</strong>
              <small>câu hỏi</small>
            </article>
            <article className="vocabulary-result-stat is-incorrect">
              <span className="vocabulary-result-stat-icon" aria-hidden="true">×</span>
              <span>Trả lời sai</span>
              <strong>{incorrectCount}</strong>
              <small>câu hỏi</small>
            </article>
            <article className="vocabulary-result-stat is-skipped">
              <span className="vocabulary-result-stat-icon" aria-hidden="true">−</span>
              <span>Bỏ qua</span>
              <strong>{skippedCount}</strong>
              <small>câu hỏi</small>
            </article>
          </div>
        </div>

        <div className="button-row">
          <Button onClick={() => go("/vocabulary/quiz")}>Làm quiz mới</Button>
          <Button kind="outline" onClick={() => go("/vocabulary")}>
            Học tiếp từ vựng
          </Button>
        </div>
      </section>

      <section className="panel vocabulary-review-list">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">ANSWER REVIEW</div>
            <h2>Đáp án và từ cần ôn</h2>
          </div>
          <span>{totalCount} câu hỏi</span>
        </div>

        {(quiz.questions || []).map((question, index) => (
          <VocabularyReviewItem
            key={question.position}
            question={question}
            index={index}
          />
        ))}
      </section>
    </>
  );
}

export default VocabularyQuizResultPage;
