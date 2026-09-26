import React, { useEffect, useState } from "react";
import examService from "../../services/examService";
import assessmentService from "../../services/assessmentService";
import { ArrowIcon, Button, Loading, Notice, partNames } from "../../shared/ui";
import Modal from "../../components/common/Modal/Modal";
import ExamAnswerTranscript from "../../components/exam/ExamAnswerTranscript/ExamAnswerTranscript";
import "./TestSetupPage.scss";

/**
 * Trang chi tiết đề thi và lựa chọn chế độ làm bài.
 *
 * URL dùng slug của đề, còn API tạo attempt vẫn nhận `exam.id` là mã dữ liệu
 * nội bộ. Chế độ luyện từng Part được giữ trong cùng màn hình này.
 */
function TestSetupPage({ testId, go }) {
  const [exam, setExam] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [answerTranscript, setAnswerTranscript] = useState(null);
  const [answerTranscriptLoading, setAnswerTranscriptLoading] = useState(false);
  const [answerTranscriptError, setAnswerTranscriptError] = useState("");
  const [answerTranscriptRetry, setAnswerTranscriptRetry] = useState(0);
  const [custom, setCustom] = useState(false);
  const [parts, setParts] = useState([]);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeAttempt, setActiveAttempt] = useState(null);

  useEffect(() => {
    examService
      .getExam(testId)
      .then(setExam)
      .catch((requestError) => setError(requestError.message));
  }, [testId]);

  useEffect(() => {
    const answerGuideMatchesExam = answerTranscript?.exam?.slug === exam?.slug;
    if (
      activeTab !== "answers" ||
      !exam?.slug ||
      answerGuideMatchesExam
    ) {
      return undefined;
    }

    let isCurrentRequest = true;
    setAnswerTranscriptLoading(true);
    setAnswerTranscriptError("");

    examService
      .getExamAnswerTranscript(exam.slug)
      .then((response) => {
        if (isCurrentRequest) {
          setAnswerTranscript(response);
        }
      })
      .catch((requestError) => {
        if (isCurrentRequest) {
          setAnswerTranscriptError(requestError.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setAnswerTranscriptLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [activeTab, answerTranscript, answerTranscriptRetry, exam?.slug]);

  /** Chọn hoặc bỏ chọn một Part trong chế độ luyện tùy chỉnh. */
  const togglePart = (partNumber) => {
    setParts((current) =>
      current.includes(partNumber)
        ? current.filter((number) => number !== partNumber)
        : [...current, partNumber],
    );
  };

  /** Tạo attempt rồi chuyển sang màn hình làm bài. */
  const startExam = async () => {
    setBusy(true);
    setError("");

    try {
      const attempt = await assessmentService.startAttempt({
        exam_id: exam.id,
        mode: custom ? "subset" : "full",
        selected_parts: custom ? parts : [],
        time_limit_seconds: custom ? minutes * 60 : 7200,
      });
      go(`/tests/${exam.slug}/run/${attempt.id}`);
    } catch (requestError) {
      const conflict = requestError.response?.data;

      if (
        requestError.response?.status === 409 &&
        conflict?.code === "active_full_test_exists" &&
        conflict.active_attempt
      ) {
        setActiveAttempt(conflict.active_attempt);
      } else {
        setError(requestError.message);
      }
    } finally {
      setBusy(false);
    }
  };

  /** Continue the existing attempt without creating or resetting its answers. */
  const continueActiveAttempt = () => {
    if (!activeAttempt) return;
    go(`/tests/${activeAttempt.exam_slug}/run/${activeAttempt.id}`);
  };

  /** Abandon the resumable attempt, then create a fresh attempt for this exam. */
  const restartFullTest = async () => {
    if (!activeAttempt || !exam) return;

    setBusy(true);
    setError("");

    try {
      await assessmentService.abandonAttempt(activeAttempt.id);
      setActiveAttempt(null);
      const attempt = await assessmentService.startAttempt({
        exam_id: exam.id,
        mode: "full",
        selected_parts: [],
        time_limit_seconds: 7200,
      });
      go(`/tests/${exam.slug}/run/${attempt.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!exam && !error) return <Loading />;

  const questionCount = exam?.question_count || 0;
  const partCount = exam?.parts?.length || 7;
  const listeningCount = (exam?.parts || [])
    .filter((part) => part.number <= 4)
    .reduce((total, part) => total + part.question_count, 0);
  const readingCount = (exam?.parts || [])
    .filter((part) => part.number >= 5)
    .reduce((total, part) => total + part.question_count, 0);

  return (
    <div className="exam-detail-page">
      <Modal
        open={Boolean(activeAttempt)}
        title="Bạn có bài thi đang làm dở"
        onClose={() => !busy && setActiveAttempt(null)}
      >
        {activeAttempt && (
          <>
            <p>
              Phiên {activeAttempt.exam_title} vẫn còn hiệu lực tại câu {activeAttempt.current_question_index + 1}
              {activeAttempt.answered_count
                ? `, đã lưu ${activeAttempt.answered_count} câu trả lời`
                : ""}.
              Bạn muốn tiếp tục phiên cũ hay hủy phiên đó để làm lại từ đầu?
            </p>
            <div className="dialog-actions">
              <Button
                kind="outline"
                disabled={busy}
                onClick={continueActiveAttempt}
              >
                Tiếp tục bài thi
              </Button>
              <Button
                kind="danger"
                disabled={busy}
                onClick={restartFullTest}
              >
                {busy ? "Đang tạo bài thi…" : "Hủy phiên cũ và làm lại"}
              </Button>
            </div>
          </>
        )}
      </Modal>
      <div className="exam-detail-breadcrumb">
        <button type="button" onClick={() => go("/tests")}>
          Đề thi TOEIC
        </button>
        <ArrowIcon />
        <strong>{exam?.title || `TOEIC Test ${testId}`}</strong>
      </div>

      <section className="exam-detail-hero">
        <div>
          <div className="eyebrow light">MOCK TEST · ETS FORMAT</div>
          <h1>{exam?.title || `TOEIC Test ${testId}`}</h1>
          <p>
            Bộ đề mô phỏng sát cấu trúc thi thật, giúp bạn làm quen áp lực thời
            gian và đánh giá năng lực hiện tại.
          </p>
        </div>
        <div className="latest-result-card">
          <small>Kết quả gần nhất</small>
          <strong>— / 990</strong>
          <span>Chưa có lịch sử làm bài</span>
        </div>
      </section>

      <div className="exam-detail-tabs" role="tablist" aria-label="Thông tin đề thi">
        <button
          id="exam-overview-tab"
          className={activeTab === "overview" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          aria-controls="exam-overview-panel"
          onClick={() => setActiveTab("overview")}
        >
          Thông tin đề thi
        </button>
        <button
          id="exam-answers-tab"
          className={activeTab === "answers" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "answers"}
          aria-controls="exam-answers-panel"
          onClick={() => setActiveTab("answers")}
        >
          Đáp án &amp; transcript
        </button>
      </div>

      {activeTab === "overview" ? (
      <div
        className="exam-detail-layout"
        id="exam-overview-panel"
        role="tabpanel"
        aria-labelledby="exam-overview-tab"
      >
        <section className="panel exam-overview-card">
          <div className="exam-section-heading">
            <div>
              <h2>Tổng quan đề thi</h2>
              <p>Kiểm tra thông tin trước khi bắt đầu.</p>
            </div>
          </div>

          <div className="exam-stat-grid">
            <div>
              <span>Trình độ</span>
              <strong>Intermediate · 600–800</strong>
            </div>
            <div>
              <span>Tổng số câu</span>
              <strong>{questionCount} câu hỏi</strong>
            </div>
            <div>
              <span>Thời lượng</span>
              <strong>120 phút</strong>
            </div>
            <div>
              <span>Kỹ năng</span>
              <strong>Listening &amp; Reading</strong>
            </div>
          </div>

          <div className="exam-mode-heading">
            <h2>Chọn cách học</h2>
            <p>Bạn có thể làm toàn bộ đề hoặc tập trung vào từng phần.</p>
          </div>

          <label className={`mode-card ${!custom ? "selected" : ""}`}>
            <input
              type="radio"
              checked={!custom}
              onChange={() => setCustom(false)}
            />
            <span className="mode-description">
              <b>Làm full test</b>
              <small>
                120 phút · {questionCount || 200} câu hỏi · Mô phỏng thi thật
              </small>
            </span>
            <span className="mode-duration">120′</span>
          </label>

          <label className={`mode-card ${custom ? "selected" : ""}`}>
            <input
              type="radio"
              checked={custom}
              onChange={() => setCustom(true)}
            />
            <span className="mode-description">
              <b>Luyện theo từng Part</b>
              <small>Chọn một hoặc nhiều phần và giới hạn thời gian</small>
            </span>
            <span className="mode-duration">Tùy chọn</span>
          </label>

          {custom && (
            <div className="custom-parts">
              <h3>Chọn Part</h3>
              <div className="part-check-grid">
                {(exam?.parts || []).map((part) => (
                  <label
                    className={`part-check ${parts.includes(part.number) ? "checked" : ""}`}
                    key={part.number}
                  >
                    <input
                      type="checkbox"
                      checked={parts.includes(part.number)}
                      onChange={() => togglePart(part.number)}
                    />
                    <b>Part {part.number}</b>
                    <small>{partNames[part.number - 1]}</small>
                    <span>{part.question_count} câu</span>
                  </label>
                ))}
              </div>
              <div className="range-heading">
                <b>Thời gian hoàn thành</b>
                <strong>{minutes} phút</strong>
              </div>
              <input
                className="time-range"
                type="range"
                min="5"
                max="120"
                step="5"
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
              />
              <div className="range-ends">
                <span>5 phút</span>
                <span>120 phút</span>
              </div>
            </div>
          )}

          <Notice error={error} />
          <Button
            onClick={startExam}
            disabled={busy || (custom && !parts.length)}
          >
            {busy
              ? "Đang chuẩn bị bài thi…"
              : custom
                ? <>Bắt đầu luyện Part đã chọn <ArrowIcon /></>
                : <>Bắt đầu làm bài <ArrowIcon /></>}
          </Button>
          <p className="setup-disclaimer">
            Tiến độ được lưu tự động trên thiết bị trong khi làm bài.
          </p>
        </section>

        <aside className="panel exam-structure-card">
          <div className="exam-section-heading">
            <div>
              <h2>Cấu trúc đề</h2>
              <p>
                {partCount} phần · {questionCount} câu hỏi
              </p>
            </div>
          </div>
          <div className="structure-row">
            <span className="structure-number">01</span>
            <span>
              <b>Listening</b>
              <small>Part 1–4 · {listeningCount || 100} câu</small>
            </span>
            <strong>45′</strong>
          </div>
          <div className="structure-row">
            <span className="structure-number">02</span>
            <span>
              <b>Reading</b>
              <small>Part 5–7 · {readingCount || 100} câu</small>
            </span>
            <strong>75′</strong>
          </div>
          <div className="structure-row">
            <span className="structure-number">03</span>
            <span>
              <b>Điểm số</b>
              <small>Thang điểm 10–990</small>
            </span>
            <strong>+</strong>
          </div>
        </aside>
      </div>
      ) : (
        <section
          className="exam-answers-tab-panel"
          id="exam-answers-panel"
          role="tabpanel"
          aria-labelledby="exam-answers-tab"
        >
          {!exam && error && <Notice error={error} />}
          {answerTranscriptLoading && <Loading />}
          {answerTranscriptError && (
            <div className="exam-answers-load-error">
              <Notice error={answerTranscriptError} />
              <Button
                kind="outline"
                onClick={() => {
                  setAnswerTranscriptRetry((attempt) => attempt + 1);
                }}
              >
                Thử tải lại
              </Button>
            </div>
          )}
          {answerTranscript?.exam?.slug === exam?.slug && (
            <ExamAnswerTranscript
              key={answerTranscript.exam.slug}
              data={answerTranscript}
            />
          )}
        </section>
      )}
    </div>
  );
}

export default TestSetupPage;
