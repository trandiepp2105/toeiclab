import React, { useEffect, useMemo, useState } from "react";
import dashboardService from "../../services/dashboardService";
import examService from "../../services/examService";
import vocabularyService from "../../services/vocabularyService";
import { ArrowIcon, Button, Notice, fmt } from "../../shared/ui";
import "./DashboardPage.scss";

const PART_LABELS = [
  "Photographs",
  "Question-Response",
  "Conversations",
  "Talks",
  "Incomplete Sentences",
  "Text Completion",
  "Reading Comprehension",
];

const emptyPart = (partNumber) => ({
  part_number: partNumber,
  name: PART_LABELS[partNumber - 1],
  question_count: 0,
  answered_count: 0,
  accuracy: null,
});

/** Dashboard thống kê kết quả luyện tập và các lối tắt học tập. */
function DashboardPage({ go, user }) {
  const [summary, setSummary] = useState(null);
  const [examData, setExamData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      examService.listExams(),
      vocabularyService.listTopics(),
      user
        ? dashboardService
            .getSummary()
            .catch((requestError) => {
              setError(
                requestError.message ||
                  "Không thể tải thống kê tài khoản. Vui lòng thử lại.",
              );
              return null;
            })
        : Promise.resolve(null),
    ])
      .then(([exams, topicList, dashboard]) => {
        setExamData(exams);
        setTopics(topicList);
        setSummary(dashboard);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [user]);

  const parts = useMemo(() => {
    const apiParts = summary?.parts || [];
    const bankPartCounts = {};
    (examData?.results || []).forEach((exam) => {
      (exam.parts || []).forEach((part) => {
        bankPartCounts[part.number] = (bankPartCounts[part.number] || 0) + part.question_count;
      });
    });
    return Array.from({ length: 7 }, (_, index) => {
      const number = index + 1;
      return apiParts.find((part) => part.part_number === number) || {
        ...emptyPart(number),
        question_count: bankPartCounts[number] || 0,
      };
    });
  }, [examData, summary]);

  const latestExam = summary?.latest_exam || examData?.results?.[0];
  const vocabulary = summary?.vocabulary || {
    quiz_count: 0,
    quiz_correct_count: 0,
    quiz_answered_count: 0,
    topic_count: topics.length,
    quiz_accuracy: null,
  };
  const score = summary?.score || { latest: null, target: 900, target_progress: 0 };
  const recommendations = summary?.recommendations?.length
    ? summary.recommendations
    : [{ part_number: 7 }, { part_number: 3 }];

  return (
    <div className={`dashboard-page ${loading ? "is-loading" : ""}`}>
      <Notice error={error} />
      <div className="dashboard-heading">
        <div>
          <h1>Thống kê kết quả luyện tập</h1>
          <p>{user ? `Chào ${user.display_name || "bạn"}, theo dõi tiến độ và tiếp tục mục tiêu TOEIC của bạn.` : "Theo dõi tiến độ học tập và chọn hoạt động tiếp theo của bạn."}</p>
        </div>
      </div>

      <section className="dashboard-top-grid">
        <article className="dashboard-card part-progress-card">
          <div className="dashboard-card-header">
            <div><h2>Luyện tập 7 Part TOEIC</h2><p>Tiến độ và độ chính xác từng phần thi.</p></div>
            <Button onClick={() => go("/parts")}>Luyện tập <ArrowIcon /></Button>
          </div>
          <div className="part-progress-grid">
            {parts.map((part) => (
              <button className="part-progress-item" key={part.part_number} onClick={() => go(`/parts/${part.part_number}`)}>
                <span className="part-progress-number">Part {part.part_number}</span>
                <span className="part-copy"><strong>{part.name}</strong><small>{fmt(part.answered_count)} / {fmt(part.question_count)} câu</small></span>
                <span className={`part-accuracy ${part.accuracy === null ? "is-empty" : part.accuracy < 70 ? "is-low" : ""}`}>{part.accuracy === null ? "—" : `${part.accuracy}%`}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="dashboard-card vocabulary-card">
          <div className="dashboard-card-header">
            <div><h2>Học từ vựng &amp; Kiểm tra</h2><p>Xây dựng vốn từ vựng bám sát đề thi TOEIC.</p></div>
            <span className="dashboard-badge">Quiz: {vocabulary.quiz_accuracy === null ? "—" : `${vocabulary.quiz_accuracy}% đúng`}</span>
          </div>
          <div className="vocabulary-metrics">
            <QuizAnswerChart
              correctCount={vocabulary.quiz_correct_count}
              answeredCount={vocabulary.quiz_answered_count}
            />
            <Metric icon="✓" label="Quiz đã làm" value={fmt(vocabulary.quiz_count)} tone="green" />
            <Metric icon="◷" label="Chủ đề" value={fmt(vocabulary.topic_count)} tone="amber" />
          </div>
          <div className="dashboard-quick-actions">
            <button onClick={() => go("/vocabulary/topics")}><span className="quick-icon blue">▤</span><span><strong>Học theo chủ đề</strong><small>Khám phá các chủ đề TOEIC</small></span><b><ArrowIcon /></b></button>
            <button onClick={() => go("/vocabulary/quiz")}><span className="quick-icon teal">✓</span><span><strong>Làm Quiz từ vựng</strong><small>Phản xạ nhanh 5 phút</small></span><b><ArrowIcon /></b></button>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card score-card">
          <div className="score-card-top"><div><span className="card-kicker">TỔNG QUAN ĐIỂM SỐ</span><h2>{score.latest?.total_score || "—"} <small>/ {score.target}</small></h2></div>{score.latest && <span className="score-change"><ArrowIcon direction="up-right" /> Đã cập nhật</span>}</div>
          <div className="score-progress"><div><span>Tiến độ mục tiêu</span><b>{score.target_progress}%</b></div><span className="score-progress-track"><i style={{ width: `${Math.min(score.target_progress, 100)}%` }} /></span><p>{score.latest ? `Còn thiếu ${Math.max(score.target - score.latest.total_score, 0)} điểm để đạt mục tiêu.` : "Hoàn thành một bài full test để xem điểm TOEIC ước tính."}</p></div>
          <div className="score-breakdown"><span>Listening <b>{score.latest?.listening?.score || "—"}</b></span><span>Reading <b>{score.latest?.reading?.score || "—"}</b></span></div>
        </article>

        <article className="dashboard-card recommendation-card">
          <div className="recommendation-heading"><span>✦</span><div><h2>Gợi ý cải thiện</h2><p>Dựa trên kết quả luyện tập</p></div></div>
          <p className="recommendation-copy">{summary?.recommendations?.length ? "Các Part dưới đây đang có tỷ lệ đúng thấp hơn các phần còn lại." : "Luyện tập thường xuyên để hệ thống đưa ra gợi ý cá nhân hóa."}</p>
          <div className="recommendation-actions">{recommendations.map((part) => <button key={part.part_number} onClick={() => go(`/parts/${part.part_number}`)}><span>Luyện tập ngay Part {part.part_number}</span><b><ArrowIcon /></b></button>)}</div>
        </article>

        <article className="dashboard-card full-test-card">
          <span className="dashboard-badge light">Mô phỏng thật</span>
          <div><h2>Thi Full Test TOEIC</h2><p>{latestExam?.title || "77 đề thi trong ngân hàng"}<br />Thời gian làm bài theo chuẩn TOEIC.</p></div>
          <Button kind="light" onClick={() => go(latestExam ? `/tests/${latestExam.slug || latestExam.id}/setup` : "/tests")}>Bắt đầu làm bài thi</Button>
        </article>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, tone }) {
  return <div className="vocabulary-metric"><span className={`metric-icon ${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}

/** Displays correct vocabulary-quiz answers as a share of all answered questions. */
function QuizAnswerChart({ correctCount = 0, answeredCount = 0 }) {
  const safeCorrectCount = Number(correctCount) || 0;
  const safeAnsweredCount = Number(answeredCount) || 0;
  const accuracy = safeAnsweredCount
    ? Math.min((safeCorrectCount / safeAnsweredCount) * 100, 100)
    : 0;
  const ringCircumference = 2 * Math.PI * 27;
  const ringOffset = ringCircumference * (1 - accuracy / 100);
  const centerLabel = safeAnsweredCount ? `${Math.round(accuracy)}%` : "—";

  return (
    <figure
      className="vocabulary-metric quiz-answer-chart"
      aria-label={`${fmt(safeCorrectCount)} câu đúng trên ${fmt(safeAnsweredCount)} câu đã trả lời trong quiz từ vựng`}
    >
      <svg className="quiz-answer-chart-ring" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="quiz-answer-chart-track" cx="36" cy="36" r="27" />
        <circle
          className="quiz-answer-chart-progress"
          cx="36"
          cy="36"
          r="27"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
        />
        <text className="quiz-answer-chart-label" x="36" y="40">
          {centerLabel}
        </text>
      </svg>
      <figcaption className="quiz-answer-chart-copy">
        <small>Câu đúng / đã làm</small>
        <strong>
          {fmt(safeCorrectCount)} / {fmt(safeAnsweredCount)}
        </strong>
        <span>{safeAnsweredCount ? "Quiz từ vựng" : "Chưa có câu trả lời"}</span>
      </figcaption>
    </figure>
  );
}

export default DashboardPage;
