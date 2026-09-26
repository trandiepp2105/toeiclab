import React, { useEffect, useState } from "react";

import "./HistoryPage.scss";
import historyService from "../../services/historyService";
import dashboardService from "../../services/dashboardService";
import {
  ArrowIcon,
  Button,
  Loading,
  Notice,
  SectionTitle,
} from "../../shared/ui";

/**
 * Hiển thị một dòng lịch sử bài thi TOEIC.
 */
function TestHistoryRow({ attempt, go }) {
  const isSubmitted = attempt.status === "submitted";
  const isInProgress = attempt.status === "in_progress";
  const partNumber = attempt.part_scores?.[0]?.part_number;
  const title =
    attempt.mode === "full"
      ? attempt.exam_title
      : `${partNumber ? `Part ${partNumber} · ` : "Luyện tập · "}${attempt.exam_title}`;

  return (
    <div className="history-row">
      <span className="history-icon">▣</span>

      <div>
        <b>{title}</b>
        <small>
          {attempt.mode === "full" ? "Full test" : "Luyện Part"} ·{" "}
          {new Date(attempt.started_at).toLocaleString("vi-VN")}
        </small>
      </div>

      <span
        className={
          isInProgress
            ? "status-pill status-warning"
            : isSubmitted
              ? "status-pill"
              : "status-pill status-cancelled"
        }
      >
        {isSubmitted ? "Đã nộp" : isInProgress ? "Đang làm" : "Đã hủy"}
      </span>

      <button
        className="text-button"
        onClick={() =>
          go(
            isSubmitted
              ? `/tests/${attempt.exam_slug || attempt.exam_id}/review/${attempt.id}`
              : isInProgress
                ? `/tests/${attempt.exam_slug || attempt.exam_id}/run/${attempt.id}`
                : `/tests/${attempt.exam_slug || attempt.exam_id}/setup`,
          )
        }
      >
        {isSubmitted
          ? "Xem kết quả"
          : isInProgress
            ? "Tiếp tục"
            : "Làm lại"} <ArrowIcon />
      </button>
    </div>
  );
}

/**
 * Hiển thị một dòng lịch sử quiz từ vựng.
 */
function QuizHistoryRow({ quiz, go }) {
  const isCompleted = quiz.status === "submitted";
  const scopeLabel =
    quiz.scope === "topic"
      ? "Theo chủ đề"
      : quiz.scope === "review"
        ? "Từ cần ôn"
        : "Tất cả từ";

  return (
    <div className="history-row">
      <span className="history-icon">▤</span>

      <div>
        <b>Quiz từ vựng · {scopeLabel}</b>
        <small>
          {quiz.correct_count} đúng · {quiz.answered_count || 0}/
          {quiz.question_count} đã trả lời ·{" "}
          {new Date(quiz.started_at).toLocaleString("vi-VN")}
        </small>
      </div>

      <span
        className={isCompleted ? "status-pill" : "status-pill status-warning"}
      >
        {isCompleted ? "Hoàn thành" : "Đang làm"}
      </span>

      <button
        className="text-button"
        onClick={() =>
          go(
            isCompleted
              ? `/vocabulary/quiz/${quiz.id}/result`
              : `/vocabulary/quiz/${quiz.id}`,
          )
        }
      >
        {isCompleted ? "Xem kết quả" : "Tiếp tục"} <ArrowIcon />
      </button>
    </div>
  );
}

/**
 * Trang lịch sử làm đề và quiz từ vựng.
 */
function HistoryPage({ go, user, openLogin }) {
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  // Tải lịch sử và thống kê thật từ server; request lỗi không được ngụy trang
  // thành trạng thái rỗng vì sẽ khiến người dùng tưởng chưa có hoạt động nào.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    let isActive = true;
    setLoading(true);
    setLoadError("");

    Promise.allSettled([
      historyService.getTestHistory(),
      historyService.getQuizHistory(),
      dashboardService.getSummary(),
    ])
      .then(([testResult, quizResult, summaryResult]) => {
        if (!isActive) return;

        const failedRequests = [];
        if (testResult.status === "fulfilled") {
          setAttempts(testResult.value);
        } else {
          failedRequests.push(testResult.reason);
        }

        if (quizResult.status === "fulfilled") {
          setQuizzes(quizResult.value);
        } else {
          failedRequests.push(quizResult.reason);
        }

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          failedRequests.push(summaryResult.reason);
        }

        if (failedRequests.length) {
          setLoadError(
            failedRequests[0]?.message ||
              "Không thể tải đầy đủ lịch sử và thống kê. Vui lòng thử lại.",
          );
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user, reloadKey]);

  const fullTestCount = summary
    ? summary.full_test_count
    : loadError
      ? null
      : attempts.filter(
          (attempt) =>
            attempt.mode === "full" && attempt.status === "submitted",
        ).length;
  const partPracticeCount =
    summary?.part_practice_count ??
    (loadError
      ? null
      : attempts.filter(
          (attempt) =>
            attempt.mode !== "full" && attempt.status === "submitted",
        ).length);
  const answeredQuizCount =
    summary?.vocabulary?.quiz_count ??
    (loadError
      ? null
      : quizzes.filter(
          (quiz) => quiz.status === "submitted" || quiz.answered_count > 0,
        ).length);
  const partStatistics = summary?.parts
    ? summary.parts
        .filter((part) => part.answered_count > 0)
        .reduce((statistics, part) => {
          statistics[part.part_number] = {
            accuracy: part.accuracy || 0,
            answeredCount: part.answered_count,
          };
          return statistics;
        }, {})
    : loadError
      ? {}
      : attempts
        .flatMap((attempt) => attempt.part_scores || [])
        .reduce((statistics, score) => {
          const current = statistics[score.part_number] || {
            correctCount: 0,
            scoredCount: 0,
          };
          current.correctCount += score.correct_count;
          current.scoredCount += score.scored_count;
          statistics[score.part_number] = current;
          return statistics;
        }, {});

  const renderEmptyState = (type) => {
    const isQuiz = type === "quizzes";

    return (
      <div className="empty-state">
        <span>{isQuiz ? "✦" : "◷"}</span>
        <h3>{isQuiz ? "Chưa có quiz từ vựng" : "Chưa có lịch sử thi"}</h3>
        <p>
          {isQuiz
            ? "Tạo quiz song ngữ để bắt đầu theo dõi kết quả."
            : "Sau khi hoàn thành một bài thi, kết quả sẽ xuất hiện tại đây."}
        </p>
        <Button onClick={() => go(isQuiz ? "/vocabulary/quiz" : "/tests")}>
          {isQuiz ? "Tạo quiz" : "Chọn đề thi"}
        </Button>
      </div>
    );
  };

  const renderTestHistory = () => {
    if (!attempts.length) {
      return renderEmptyState("tests");
    }

    return attempts.map((attempt) => (
      <TestHistoryRow key={attempt.id} attempt={attempt} go={go} />
    ));
  };

  const renderQuizHistory = () => {
    if (!quizzes.length) {
      return renderEmptyState("quizzes");
    }

    return quizzes.map((quiz) => (
      <QuizHistoryRow key={quiz.id} quiz={quiz} go={go} />
    ));
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <>
        <SectionTitle
          eyebrow="YOUR LEARNING JOURNEY"
          title="Lịch sử hoạt động"
          description="Đăng nhập để lưu và xem lại lịch sử luyện tập của bạn."
        />
        <div className="panel history-auth-prompt">
          <h2>Lịch sử cá nhân</h2>
          <p>Đăng nhập để đồng bộ kết quả bài thi, quiz và tiến độ học tập.</p>
          <Button onClick={openLogin}>Đăng nhập</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        eyebrow="YOUR LEARNING JOURNEY"
        title="Lịch sử hoạt động"
        description="Theo dõi các lượt làm đề và bài kiểm tra từ vựng."
      />

      <Notice error={loadError} />
      {loadError && (
        <div className="history-retry-row">
          <Button
            kind="outline"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Tải lại dữ liệu
          </Button>
        </div>
      )}

      <div className="stat-grid history-stats">
        <div className="stat-card">
          <span className="stat-label">TỔNG SỐ TỪ VỰNG</span>
          <b>{summary ? summary.vocabulary.total_count : "—"}</b>
          <small>
            trong ngân hàng từ vựng
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">QUIZ TỪ VỰNG</span>
          <b>{answeredQuizCount ?? "—"}</b>
          <small>lượt đã bắt đầu trả lời</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">LUYỆN TỪNG PART</span>
          <b>{partPracticeCount ?? "—"}</b>
          <small>lượt luyện tập</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">FULL TEST</span>
          <b>{fullTestCount ?? "—"}</b>
          <small>lượt thi hoàn chỉnh</small>
        </div>
      </div>

      {Object.keys(partStatistics).length > 0 && (
        <section className="panel history-part-progress">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TIẾN ĐỘ THEO PART</div>
              <h2>Độ chính xác tích lũy</h2>
            </div>
          </div>

          {Object.entries(partStatistics).map(([partNumber, statistics]) => {
            const percentage = statistics.accuracy ?? (
              statistics.scoredCount
                ? Math.round(
                    (statistics.correctCount / statistics.scoredCount) * 100,
                  )
                : 0
            );

            return (
              <div className="history-part-row" key={partNumber}>
                <span>Part {partNumber}</span>
                <div className="history-part-track">
                  <span style={{ width: `${percentage}%` }} />
                </div>
                <strong>{percentage}%</strong>
              </div>
            );
          })}
        </section>
      )}

      <div className="history-tabs">
        {[
          ["all", "Tất cả"],
          ["tests", `Bài thi (${attempts.length})`],
          ["quizzes", `Quiz từ vựng (${quizzes.length})`],
        ].map(([value, label]) => (
          <button
            className={tab === value ? "selected" : ""}
            key={value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "all" ? (
        <div className="history-columns">
          <section className="panel history-list">
            <div className="panel-heading">
              <h2>Bài thi gần đây</h2>
            </div>
            {renderTestHistory()}
          </section>
          <section className="panel history-list">
            <div className="panel-heading">
              <h2>Quiz gần đây</h2>
            </div>
            {renderQuizHistory()}
          </section>
        </div>
      ) : (
        <div className="panel history-list">
          {tab === "tests" ? renderTestHistory() : renderQuizHistory()}
        </div>
      )}
    </>
  );
}

export default HistoryPage;
