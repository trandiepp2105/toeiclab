import React, { useEffect, useMemo, useRef, useState } from "react";
import practiceService from "../../services/practiceService";
import { ArrowIcon, Button, Loading, Notice, partNames, safeMarkup } from "../../shared/ui";
import "../PartPracticePage/PartPracticePage.scss";

const SINGLE_PARTS = new Set([1, 2, 5]);

/** Đọc câu hỏi đầu lượt tiếp theo đã lưu riêng cho từng Part trên thiết bị. */
function readSavedCursor(partNumber, groupCount) {
  try {
    const savedCursor = Number(
      window.localStorage.getItem(`toeiclab-part-cursor-${partNumber}`),
    );
    if (!Number.isInteger(savedCursor) || groupCount < 1) return 0;
    return ((savedCursor % groupCount) + groupCount) % groupCount;
  } catch (_) {
    return 0;
  }
}

/** Lưu vị trí tiếp tục; thao tác quay lui không gọi hàm này. */
function saveCursor(partNumber, cursor) {
  try {
    window.localStorage.setItem(`toeiclab-part-cursor-${partNumber}`, cursor);
  } catch (_) {
    // Luyện tập vẫn hoạt động nếu trình duyệt chặn localStorage.
  }
}

/** Remove the source exam's question number from a standalone question stem. */
function removeLeadingQuestionNumber(questionTitle) {
  return String(questionTitle || "")
    .replace(/^\s*\d+\s*[.)]?\s*/, "")
    .trim();
}

/**
 * Màn hình luyện câu hỏi của một Part trên toàn bộ ngân hàng đề.
 * Câu đơn được chấm ngay; cụm câu chỉ chấm sau khi người dùng trả lời đủ.
 */
function PartPracticeRunPage({ partNumber, go }) {
  const part = Number(partNumber);
  const [data, setData] = useState(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const practiceRunRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setGroupIndex(0);
    setResumeIndex(0);
    setAnswers({});
    setResults({});
    setError("");
    setCycleCompleted(false);

    practiceService
      .getPartQuestions(part)
      .then((partData) => {
        const nextIndex = readSavedCursor(part, partData.groups.length);
        setData(partData);
        setGroupIndex(nextIndex);
        setResumeIndex(nextIndex);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [part]);

  useEffect(() => {
    setElapsedSeconds(0);
    const timer = window.setInterval(
      () => setElapsedSeconds((current) => current + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [part]);

  useEffect(() => {
    const updateFullscreenState = () => {
      setFullscreen(document.fullscreenElement === practiceRunRef.current);
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  }, []);

  /** Bật/tắt chế độ toàn màn hình và đồng bộ với trạng thái của trình duyệt. */
  const toggleFullscreen = async () => {
    try {
      const practiceRunElement = practiceRunRef.current;

      if (!practiceRunElement) return;

      if (document.fullscreenElement === practiceRunElement) {
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await practiceRunElement.requestFullscreen();
    } catch (_) {
      setError("Trình duyệt không thể bật chế độ toàn màn hình.");
    }
  };

  const groups = data?.groups || [];
  const currentGroup = groups[groupIndex];
  const currentQuestions = useMemo(
    () => currentGroup?.questions || [],
    [currentGroup],
  );
  const isSinglePart = SINGLE_PARTS.has(part);
  const answeredCount = currentQuestions.filter(
    (question) => answers[question.id],
  ).length;
  const groupIsChecked = currentQuestions.every(
    (question) => results[question.id],
  );
  const totalQuestionCount = groups.reduce(
    (total, group) => total + (group.questions?.length || 0),
    0,
  );
  const questionsBeforeCurrentGroup = groups
    .slice(0, groupIndex)
    .reduce((total, group) => total + (group.questions?.length || 0), 0);
  const currentQuestionStartIndex = questionsBeforeCurrentGroup + 1;
  const progressLabel = `${currentQuestionStartIndex} / ${totalQuestionCount}`;
  const progressPercent = totalQuestionCount
    ? (currentQuestionStartIndex / totalQuestionCount) * 100
    : 0;
  const timeLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const currentPassage = useMemo(
    () => currentQuestions.find((question) => question.passage_html),
    [currentQuestions],
  );
  const hasReadingPassage = [6, 7].includes(part) && Boolean(currentPassage);

  const currentHasImage = Boolean(currentQuestions[0]?.image_files?.length);
  const listeningImageLayout = part === 1 && currentHasImage;
  const listeningLayout = part <= 4;
  const showQuestionPrompt = ![1, 2].includes(part);
  const hasActiveGroup = Boolean(data && currentGroup);

  useEffect(() => {
    // Part 1 uses normal document scrolling rather than a locked split-pane view.
    if (!hasActiveGroup || part === 1) return undefined;

    document.body.classList.add("toeic-part-practice-active");
    return () => document.body.classList.remove("toeic-part-practice-active");
  }, [hasActiveGroup, part]);

  /** Lưu câu/cụm tiếp theo sau khi câu hiện tại đã được chấm thành công. */
  const rememberNextGroup = () => {
    const nextIndex = (groupIndex + 1) % groups.length;
    setResumeIndex(nextIndex);
    saveCursor(part, nextIndex);
  };

  /** Chấm ngay một câu đơn sau khi người dùng chọn đáp án. */
  const chooseSingleAnswer = async (questionId, option) => {
    if (results[questionId] || busy) return;
    setAnswers((current) => ({ ...current, [questionId]: option }));
    setBusy(true);
    setError("");
    try {
      const response = await practiceService.checkAnswers({
        [questionId]: option,
      });
      setResults((current) => ({
        ...current,
        [questionId]: response.checked[0],
      }));
      rememberNextGroup();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  /** Chọn đáp án trong một cụm; chưa gọi chấm cho đến khi bấm nộp. */
  const chooseGroupAnswer = (questionId, option) => {
    if (groupIsChecked || results[questionId]) return;
    setAnswers((current) => ({ ...current, [questionId]: option }));
    setError("");
  };

  /** Chấm toàn bộ cụm câu sau khi đã chọn đủ đáp án. */
  const submitGroup = async () => {
    if (answeredCount !== currentQuestions.length) {
      setError("Hãy chọn đáp án cho tất cả câu hỏi trong cụm trước khi nộp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await practiceService.checkAnswers(
        Object.fromEntries(
          currentQuestions.map((question) => [question.id, answers[question.id]]),
        ),
      );
      setResults((current) => ({
        ...current,
        ...Object.fromEntries(
          response.checked.map((result) => [result.question_id, result]),
        ),
      }));
      rememberNextGroup();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  /** Tiến tiếp một câu/cụm và cập nhật điểm tiếp tục nếu đang ở đầu tiến độ. */
  const moveNext = () => {
    const nextIndex = (groupIndex + 1) % groups.length;
    const isLastGroup = groupIndex === groups.length - 1;

    setGroupIndex(nextIndex);
    if (groupIndex === resumeIndex) {
      setResumeIndex(nextIndex);
      saveCursor(part, nextIndex);
    }
    setError("");
    setCycleCompleted(isLastGroup);
  };

  /** Quay lại câu/cụm trước để xem lại mà không lùi điểm tiếp tục đã lưu. */
  const movePrevious = () => {
    setGroupIndex((current) =>
      current === 0 ? Math.max(0, groups.length - 1) : current - 1,
    );
    setError("");
    setCycleCompleted(false);
  };

  if (loading) return <Loading />;
  if (!data || !currentGroup) {
    return (
      <div className="empty-state panel">
        <h3>Chưa có câu hỏi cho Part này</h3>
        <Button kind="outline" onClick={() => go("/parts")}>
          <ArrowIcon direction="left" /> Chọn Part khác
        </Button>
      </div>
    );
  }

  return (
    <div className="part-practice-run" ref={practiceRunRef}>
      <header className="practice-run-header">
        <div>
          <div className="eyebrow">LUYỆN TẬP TỪNG PHẦN</div>
          <h1>Part {part} · {partNames[part - 1]}</h1>
          <p>
            Câu {progressLabel}
            {part !== 3 && (
              <> · {isSinglePart ? "Xem kết quả ngay sau khi chọn đáp án" : "Trả lời đủ rồi kiểm tra đáp án"}</>
            )}
          </p>
        </div>
        <div className="practice-run-actions">
          <div className="practice-timer">
            <small>Thời gian luyện</small>
            <strong>{timeLabel}</strong>
          </div>
          <Button
            kind="outline"
            type="button"
            aria-label={fullscreen ? "Thoát toàn màn hình" : "Bật toàn màn hình"}
            aria-pressed={fullscreen}
            onClick={toggleFullscreen}
          >
            ⛶ {fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </Button>
        </div>
      </header>
      <div className="practice-progress-bar">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      {cycleCompleted && (
        <div className="practice-cycle-note">
          Bạn đã hoàn thành toàn bộ Part {part}. Hệ thống đã quay lại câu hỏi đầu tiên.
        </div>
      )}
      <div className={`practice-work-layout ${hasReadingPassage ? "practice-reading-layout" : ""} ${listeningLayout ? "practice-listening-layout" : ""} ${part === 1 ? "practice-part-one-layout" : ""}`}>
        {hasReadingPassage && (
          <section className="practice-passage">
            <div className="eyebrow">READING PASSAGE · {currentGroup.exam.title}</div>
            <div dangerouslySetInnerHTML={{ __html: safeMarkup(currentPassage.passage_html) }} />
          </section>
        )}
        {listeningLayout && (
          <div className="practice-listening-media">
            <section className="practice-listening-audio panel">
              <div className="eyebrow">AUDIO · PART {part}</div>
              <div className="practice-audio-controls">
                {(currentQuestions[0]?.audio_files || []).length > 0 ? (
                  currentQuestions[0].audio_files.map((src) => (
                    <audio controls preload="none" key={src} src={src}>
                      Trình duyệt không hỗ trợ audio.
                    </audio>
                  ))
                ) : (
                  <small>Không có file audio cho câu hỏi này.</small>
                )}
              </div>
            </section>
            {listeningImageLayout && (
              <section className="practice-listening-image panel">
                <div className="eyebrow">HÌNH ẢNH · PART {part}</div>
                {currentQuestions[0].image_files.map((src) => (
                  <img
                    className="practice-question-image"
                    src={src}
                    alt={`Câu ${currentQuestions[0].number}`}
                    key={src}
                  />
                ))}
              </section>
            )}
          </div>
        )}
        <main className="practice-question-card panel">
          {!isSinglePart && (
            <div className="practice-question-heading">
              <span>{answeredCount}/{currentQuestions.length} đã chọn</span>
            </div>
          )}
          {currentQuestions.map((question) => {
            const result = results[question.id];
            const questionTitle = removeLeadingQuestionNumber(question.title);
            return (
              <section
                className={`practice-question-block ${isSinglePart ? "practice-single-question" : ""}`}
                key={question.id}
              >
                {!isSinglePart && (
                  <div className="practice-question-label">Question {question.number}</div>
                )}
                {showQuestionPrompt && !question.passage_id && question.content_html ? (
                  <div
                    className="practice-question-prompt"
                    dangerouslySetInnerHTML={{
                      __html: safeMarkup(question.content_html),
                    }}
                  />
                ) : showQuestionPrompt && questionTitle ? (
                  <h3 className="practice-question-prompt">
                    {questionTitle}
                  </h3>
                ) : null}
                <div className="practice-options">
                  {Object.entries(question.options || {}).map(([letter, text]) => {
                    const selected = answers[question.id] === letter;
                    const correct = result?.correct_answer === letter;
                    const wrong = result && selected && !result.is_correct;
                    return (
                      <button
                        className={`practice-option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                        disabled={Boolean(result) || busy}
                        aria-label={`Chọn đáp án ${letter}`}
                        key={letter}
                        type="button"
                        onClick={() => (isSinglePart ? chooseSingleAnswer(question.id, letter) : chooseGroupAnswer(question.id, letter))}
                      >
                        <span>{letter}</span>
                        <b>
                          {[1, 2].includes(part) ? (result ? text : "") : text}
                        </b>
                      </button>
                    );
                  })}
                </div>
                {result && (
                  <div className={`practice-explanation ${result.is_correct ? "correct" : "wrong"}`}>
                    <b>{result.is_correct ? "✓ Chính xác" : "✕ Chưa chính xác"}</b>
                    <p>{result.explanation?.reason || "Chưa có giải thích cho câu này."}</p>
                    {result.explanation?.tip && <small>Mẹo: {result.explanation.tip}</small>}
                  </div>
                )}
              </section>
            );
          })}
          <Notice error={error} />
          <div className="practice-controls">
            <Button kind="outline" onClick={movePrevious}><ArrowIcon direction="left" /> Câu trước</Button>
            {!isSinglePart && (
              <Button disabled={groupIsChecked || busy} onClick={submitGroup}>
                {groupIsChecked ? "Đã kiểm tra đáp án" : "Kiểm tra đáp án"}
              </Button>
            )}
            <Button disabled={busy} onClick={moveNext}>Câu tiếp theo <ArrowIcon /></Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PartPracticeRunPage;
