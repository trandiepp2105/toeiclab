import React, { useEffect, useMemo, useRef, useState } from "react";
import practiceService from "../../services/practiceService";
import { ArrowIcon, Button, Loading, Notice, partNames, safeMarkup } from "../../shared/ui";
import "../PartPracticePage/PartPracticePage.scss";

const SINGLE_PARTS = new Set([1, 2, 5]);
const MAX_CACHED_GROUPS = 18;
const NAVIGATION_DEBOUNCE_MS = 300;

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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [windowOffset, setWindowOffset] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const practiceRunRef = useRef(null);
  const workLayoutRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const navigationInProgressRef = useRef(false);
  const navigationHandlersRef = useRef({});
  const busyRef = useRef(busy);
  const windowRequestRef = useRef(false);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => () => window.clearTimeout(navigationTimerRef.current), []);

  useEffect(() => {
    window.clearTimeout(navigationTimerRef.current);
  }, [part]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setGroupIndex(0);
    setQuestionIndex(0);
    setAnswers({});
    setResults({});
    setError("");
    setCycleCompleted(false);

    practiceService
      .getPartQuestions(part)
      .then((partData) => {
        setData(partData);
        setWindowOffset(partData.question_offset || 0);
        const resumeGroupIndex = (partData.groups || []).findIndex((group) =>
          group.questions.some((question) => question.id === partData.saved_question_id),
        );
        const safeGroupIndex = Math.max(0, resumeGroupIndex);
        const resumeQuestionIndex = resumeGroupIndex >= 0
          ? partData.groups[resumeGroupIndex].questions.findIndex(
              (question) => question.id === partData.saved_question_id,
            )
          : 0;
        setGroupIndex(safeGroupIndex);
        setQuestionIndex(Math.max(0, resumeQuestionIndex));
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
  const activeQuestion = currentQuestions[questionIndex] || currentQuestions[0];
  const activeResult = activeQuestion ? results[activeQuestion.id] : null;
  const activeQuestionTitle = removeLeadingQuestionNumber(activeQuestion?.title);
  const isSinglePart = SINGLE_PARTS.has(part);
  const answeredCount = currentQuestions.filter(
    (question) => answers[question.id],
  ).length;
  const groupIsChecked = currentQuestions.every(
    (question) => results[question.id],
  );
  const totalQuestionCount = data?.total_questions || 0;
  const questionsBeforeCurrentGroup = groups
    .slice(0, groupIndex)
    .reduce((total, group) => total + (group.questions?.length || 0), 0);
  const currentQuestionStartIndex = windowOffset + questionsBeforeCurrentGroup + questionIndex + 1;
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

  const currentHasImage = Boolean(activeQuestion?.image_files?.length);
  const listeningImageLayout = part === 1 && currentHasImage;
  const listeningLayout = part <= 4;
  const showQuestionPrompt = ![1, 2].includes(part);
  const hasActiveGroup = Boolean(data && currentGroup);
  const currentQuestionId = activeQuestion?.id;

  useEffect(() => {
    if (!hasActiveGroup || !listeningLayout) return undefined;

    const audio = workLayoutRef.current?.querySelector(".practice-listening-audio audio");
    if (!audio) return undefined;

    audio.currentTime = 0;
    const playback = audio.play();
    playback?.catch?.(() => {
      // Autoplay can be denied before the browser has received a user gesture.
    });
    return undefined;
  }, [currentQuestionId, hasActiveGroup, listeningLayout, part]);

  useEffect(() => {
    if (!hasActiveGroup || window.innerWidth > 560) return;

    const target = hasReadingPassage
      ? workLayoutRef.current?.querySelector(".practice-passage")
      : listeningImageLayout
        ? workLayoutRef.current?.querySelector(".practice-listening-image")
        : null;
    target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [
    currentQuestionId,
    hasActiveGroup,
    hasReadingPassage,
    listeningImageLayout,
    part,
  ]);

  useEffect(() => {
    // Part 1 uses normal document scrolling rather than a locked split-pane view.
    if (!hasActiveGroup || part === 1) return undefined;

    document.body.classList.add("toeic-part-practice-active");
    return () => document.body.classList.remove("toeic-part-practice-active");
  }, [hasActiveGroup, part]);

  /** Retain the checked group's final question in the legacy progress record. */
  const saveCurrentGroup = (index) => {
    const questions = groups[index]?.questions || [];
    const questionId = questions[questions.length - 1]?.id;
    if (questionId) {
      practiceService.savePartProgress(part, questionId).catch(() => {});
    }
  };

  /** Fetch another bounded group window when navigation reaches a loaded edge. */
  const loadAdjacentWindow = async (direction) => {
    const edgeGroup = direction === "next" ? groups[groups.length - 1] : groups[0];
    const edgeQuestion = direction === "next"
      ? edgeGroup?.questions?.[edgeGroup.questions.length - 1]
      : edgeGroup?.questions?.[0];
    if (!edgeQuestion || busy || windowRequestRef.current) return false;

    windowRequestRef.current = true;
    setBusy(true);
    setError("");
    try {
      const nextWindow = await practiceService.getPartQuestions(part, {
        cursor: edgeQuestion.id,
        direction,
      });
      if (!nextWindow.groups.length) return false;
      if (direction === "next") {
        const combinedGroups = [...groups, ...nextWindow.groups];
        const removedGroups = Math.max(0, combinedGroups.length - MAX_CACHED_GROUPS);
        const removedQuestionCount = combinedGroups
          .slice(0, removedGroups)
          .reduce((count, group) => count + group.questions.length, 0);
        setData((current) => ({
          ...current,
          ...nextWindow,
          question_offset: current.question_offset + removedQuestionCount,
          has_previous: current.has_previous || removedGroups > 0,
          groups: combinedGroups.slice(-MAX_CACHED_GROUPS),
        }));
        setWindowOffset((current) => current + removedQuestionCount);
        setGroupIndex(groups.length - removedGroups);
        setQuestionIndex(0);
      } else {
        const combinedGroups = [...nextWindow.groups, ...groups];
        setData((current) => ({
          ...current,
          ...nextWindow,
          has_next: current.has_next,
          groups: combinedGroups.slice(0, MAX_CACHED_GROUPS),
        }));
        setWindowOffset(nextWindow.question_offset);
        setGroupIndex(nextWindow.groups.length - 1);
        const previousGroup = nextWindow.groups[nextWindow.groups.length - 1];
        setQuestionIndex(Math.max(0, (previousGroup?.questions?.length || 1) - 1));
      }
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      windowRequestRef.current = false;
      setBusy(false);
    }
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
      saveCurrentGroup(groupIndex);
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
      saveCurrentGroup(groupIndex);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  /** Activate the next question, loading another ordered window when needed. */
  const moveNext = async () => {
    if (questionIndex < currentQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setError("");
      setCycleCompleted(false);
      return;
    }
    if (groupIndex === groups.length - 1) {
      const loaded = await loadAdjacentWindow("next");
      if (!loaded && data?.has_next === false) {
        try {
          const firstWindow = await practiceService.getPartQuestions(part, {
            direction: "first",
          });
          setData(firstWindow);
          setGroupIndex(0);
          setQuestionIndex(0);
          setWindowOffset(firstWindow.question_offset || 0);
          setCycleCompleted(true);
        } catch (requestError) {
          setError(requestError.message);
        }
      }
      return;
    }
    const nextIndex = groupIndex + 1;
    setGroupIndex(nextIndex);
    setQuestionIndex(0);
    setError("");
    setCycleCompleted(false);
  };

  /** Activate the previous question, loading the preceding window if needed. */
  const movePrevious = async () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setError("");
      setCycleCompleted(false);
      return;
    }
    if (groupIndex === 0) {
      const loaded = await loadAdjacentWindow("previous");
      if (!loaded && data?.has_previous === false) return;
      return;
    }
    const previousIndex = groupIndex - 1;
    setGroupIndex(previousIndex);
    const previousGroup = groups[previousIndex];
    setQuestionIndex(Math.max(0, (previousGroup?.questions?.length || 1) - 1));
    setError("");
    setCycleCompleted(false);
  };

  navigationHandlersRef.current = { next: moveNext, previous: movePrevious };

  /** Coalesce repeated arrow clicks so one burst advances only one question. */
  const scheduleNavigation = (direction) => {
    window.clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = window.setTimeout(async () => {
      if (navigationInProgressRef.current || busyRef.current) return;

      navigationInProgressRef.current = true;
      try {
        await navigationHandlersRef.current[direction]?.();
      } finally {
        navigationInProgressRef.current = false;
      }
    }, NAVIGATION_DEBOUNCE_MS);
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
    <div
      className={`part-practice-run ${fullscreen ? "is-fullscreen" : ""}`}
      ref={practiceRunRef}
    >
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
      <div ref={workLayoutRef} className={`practice-work-layout ${hasReadingPassage ? "practice-reading-layout" : ""} ${listeningLayout ? "practice-listening-layout" : ""} ${part === 1 ? "practice-part-one-layout" : ""}`}>
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
                {(activeQuestion?.image_files || []).map((src) => (
                  <img
                    className="practice-question-image"
                    src={src}
                    alt={`Câu ${activeQuestion.number}`}
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
          {activeQuestion && (
              <section
                className={`practice-question-block ${isSinglePart ? "practice-single-question" : ""}`}
                key={activeQuestion.id}
              >
                {!isSinglePart && (
                  <div className="practice-question-label">Question {activeQuestion.number}</div>
                )}
                {showQuestionPrompt && !activeQuestion.passage_id && activeQuestion.content_html ? (
                  <div
                    className="practice-question-prompt"
                    dangerouslySetInnerHTML={{
                      __html: safeMarkup(activeQuestion.content_html),
                    }}
                  />
                ) : showQuestionPrompt && activeQuestionTitle ? (
                  <h3 className="practice-question-prompt">
                    {activeQuestionTitle}
                  </h3>
                ) : null}
                <div className="practice-options">
                  {Object.entries(activeQuestion.options || {}).map(([letter, text]) => {
                    const selected = answers[activeQuestion.id] === letter;
                    const correct = activeResult?.correct_answer === letter;
                    const wrong = activeResult && selected && !activeResult.is_correct;
                    return (
                      <button
                        className={`practice-option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                        disabled={Boolean(activeResult) || busy}
                        aria-label={`Chọn đáp án ${letter}`}
                        key={letter}
                        type="button"
                        onClick={() => (isSinglePart ? chooseSingleAnswer(activeQuestion.id, letter) : chooseGroupAnswer(activeQuestion.id, letter))}
                      >
                        <span>{letter}</span>
                        <b>
                          {[1, 2].includes(part) ? (activeResult ? text : "") : text}
                        </b>
                      </button>
                    );
                  })}
                </div>
                {activeResult && (
                  <div className={`practice-explanation ${activeResult.is_correct ? "correct" : "wrong"}`}>
                    <b>{activeResult.is_correct ? "✓ Chính xác" : "✕ Chưa chính xác"}</b>
                    <p>{activeResult.explanation?.reason || "Chưa có giải thích cho câu này."}</p>
                    {activeResult.explanation?.tip && <small>Mẹo: {activeResult.explanation.tip}</small>}
                  </div>
                )}
              </section>
          )}
          <Notice error={error} />
          <div className="practice-controls">
            <Button kind="outline" disabled={busy} onClick={() => scheduleNavigation("previous")}><ArrowIcon direction="left" /> Câu trước</Button>
            {!isSinglePart && (
              <Button disabled={groupIsChecked || busy} onClick={submitGroup}>
                {groupIsChecked ? "Đã kiểm tra đáp án" : "Kiểm tra đáp án"}
              </Button>
            )}
            <Button disabled={busy} onClick={() => scheduleNavigation("next")}>Câu tiếp theo <ArrowIcon /></Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PartPracticeRunPage;
