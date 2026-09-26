import React, { useEffect, useState } from "react";
import quizService from "../../services/quizService";
import { ArrowIcon, Button, Loading, Notice } from "../../shared/ui";
import "./VocabularyQuizRunPage.scss";

/**
 * Màn hình làm quiz từ vựng theo từng câu.
 */
function VocabularyQuizRunPage({ attemptId, go }) {
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Tải quiz được tạo từ trang cấu hình.
  useEffect(() => {
    quizService
      .getVocabularyQuiz(attemptId)
      .then(setQuiz)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [attemptId]);
  /** Lưu và chấm lựa chọn ngay; backend tự hoàn thành quiz sau câu cuối. */
  const choose = async (value) => {
    const currentQuestion = quiz?.questions[index];
    if (
      !quiz ||
      quiz.status === "submitted" ||
      currentQuestion?.selected_value ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await quizService.submitVocabularyAnswer(
        attemptId,
        currentQuestion.position,
        value,
      );

      const updatedQuiz = {
        ...quiz,
        status: result.status || quiz.status,
        correct_count: result.correct_count ?? quiz.correct_count,
        answered_count:
          result.answered_count ??
          quiz.questions.filter((question) => question.selected_value).length +
            1,
        questions: quiz.questions.map((question, questionIndex) =>
          questionIndex === index
            ? {
                ...question,
                selected_value: value,
                is_correct: result.is_correct,
                correct_value: result.correct_value,
              }
            : question,
        ),
      };
      setQuiz(updatedQuiz);

      if (updatedQuiz.status === "submitted") {
        go(`/vocabulary/quiz/${attemptId}/result`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Tạo class hiển thị trạng thái của một phương án quiz.
   */
  const getOptionClassName = (question, option) => {
    const isSelected = question.selected_value === option;
    const isAnswered = question.is_correct !== null && isSelected;
    const isCorrectOption =
      question.is_correct === false && option === question.correct_value;

    return [
      "quiz-option",
      isSelected && "chosen",
      isAnswered && (question.is_correct ? "correct" : "wrong"),
      isCorrectOption && "correct",
    ]
      .filter(Boolean)
      .join(" ");
  };

  if (loading) return <Loading />;
  if (!quiz) return <Notice error={error} />;
  const q = quiz.questions[index];
  const done = quiz.status === "submitted";
  return (
    <>
      <div className="back-row">
        <button className="text-button" onClick={() => go("/vocabulary")}>
          <ArrowIcon direction="left" /> Từ vựng
        </button>
        <span>QUIZ · {quiz.question_count} CÂU</span>
      </div>
      {done ? (
        <section className="panel quiz-result">
          <span className="result-medal">✦</span>
          <div className="eyebrow">QUIZ COMPLETED</div>
          <h1>
            {quiz.correct_count}/{quiz.question_count} câu đúng
          </h1>
          <p>
            {Math.round(
              (quiz.correct_count * 100) / Math.max(1, quiz.question_count),
            )}
            % chính xác · Các từ sai đã được thêm vào danh sách cần ôn.
          </p>
          <Button onClick={() => go("/vocabulary/quiz")}>Làm bài mới</Button>
        </section>
      ) : (
        <div className="quiz-run-grid">
          <section className="panel quiz-question">
            <div className="quiz-progress-top">
              <span>
                Câu {index + 1} / {quiz.question_count}
              </span>
              <span className="progress-line">
                <span
                  style={{
                    width: `${((index + 1) / quiz.question_count) * 100}%`,
                  }}
                />
              </span>
            </div>
            <div className="eyebrow">
              {q.prompt_type === "vi_to_en"
                ? "CHỌN TỪ TIẾNG ANH"
                : "CHỌN NGHĨA TIẾNG VIỆT"}
            </div>
            <h1>{q.prompt}</h1>
            <div className="quiz-options">
              {q.options.map((option, i) => (
                <button
                  className={getOptionClassName(q, option)}
                  key={`${i}-${option}`}
                  disabled={busy || Boolean(q.selected_value)}
                  onClick={() => choose(option)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                </button>
              ))}
            </div>
            {q.is_correct !== null && (
              <div
                className={`answer-feedback ${q.is_correct ? "feedback-correct" : "feedback-wrong"}`}
              >
                {q.is_correct ? "Chính xác!" : "Chưa đúng."}{" "}
                {q.is_correct === false && (
                  <>
                    Đáp án: <b>{q.correct_value}</b>
                  </>
                )}
              </div>
            )}
            <div className="quiz-controls">
              <Button
                kind="outline"
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
              >
                <ArrowIcon direction="left" /> Câu trước
              </Button>
              <span>
                {index + 1} / {quiz.question_count}
              </span>
              {index < quiz.questions.length - 1 ? (
                <Button onClick={() => setIndex(index + 1)}>
                  Câu tiếp theo <ArrowIcon />
                </Button>
              ) : (
                <span className="quiz-completion-hint">
                  {q.selected_value
                    ? `Còn ${Math.max(quiz.question_count - (quiz.answered_count || 0), 0)} câu chưa trả lời.`
                    : "Chọn đáp án để tự động hoàn thành quiz."}
                </span>
              )}
            </div>
            <Notice error={error} />
          </section>
          <aside className="panel quiz-aside">
            <span className="eyebrow">NHẮC NHẸ</span>
            <h3>Hãy đọc kỹ trước khi chọn</h3>
            <p>
              Mỗi lựa chọn được lưu và chấm ngay. Quiz tự hoàn thành sau khi
              bạn đã trả lời tất cả câu hỏi.
            </p>
            <div className="quiz-dots">
              {quiz.questions.map((x, i) => (
                <button
                  key={i}
                  className={`${i === index ? "current" : ""} ${x.is_correct === true ? "dot-correct" : ""} ${x.is_correct === false ? "dot-wrong" : ""}`}
                  onClick={() => setIndex(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default VocabularyQuizRunPage;
