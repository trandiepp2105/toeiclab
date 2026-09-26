import React, { useEffect, useState } from "react";

import "./VocabularyQuizResultPage.scss";
import VocabularyQuizProgress from "../../components/vocabulary/VocabularyQuizProgress/VocabularyQuizProgress";
import VocabularyReviewItem from "../../components/vocabulary/VocabularyReviewItem/VocabularyReviewItem";
import quizService from "../../services/quizService";
import { ArrowIcon, Button, Loading, Notice } from "../../shared/ui";

const getQuizErrorMessage = (error) => {
  return (
    error?.response?.data?.error ||
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

  useEffect(() => {
    quizService
      .getVocabularyQuizResult(attemptId)
      .then(setQuiz)
      .catch((requestError) => setError(getQuizErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !quiz) {
    return (
      <>
        <Notice error={error || "Không tìm thấy kết quả quiz."} />
        <Button kind="outline" onClick={() => go("/vocabulary/quiz")}>
          Tạo quiz mới
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="back-row">
        <button className="text-button" onClick={() => go("/history")}>
          <ArrowIcon direction="left" /> Lịch sử học tập
        </button>
        <span>VOCABULARY QUIZ RESULT</span>
      </div>

      <section className="panel vocabulary-result-hero">
        <VocabularyQuizProgress
          correctCount={quiz.correct_count}
          questionCount={quiz.question_count}
        />

        <div className="button-row">
          <Button onClick={() => go("/vocabulary/quiz")}>Kiểm tra lại</Button>
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
          <span>{quiz.question_count} câu hỏi</span>
        </div>

        {quiz.questions.map((question, index) => (
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
