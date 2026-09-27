import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import assessmentService from "../../services/assessmentService";
import {
  Button,
  ArrowIcon,
  Loading,
  Notice,
  safeMarkup,
} from "../../shared/ui";
import Modal from "../../components/common/Modal/Modal";
import "./TestRunPage.scss";

const englishPartNames = [
  "Photographs",
  "Question-Response",
  "Conversations",
  "Talks",
  "Incomplete Sentences",
  "Text Completion",
  "Reading Comprehension",
];

/**
 * Bỏ qua asset đã được nhúng sẵn trong HTML đoạn văn.
 * Backend trả cả HTML passage và danh sách assets; một số passage chứa cùng
 * một ảnh ở cả hai nơi nên cần so khớp theo tên file trước khi render.
 */
function getAdditionalPassageAssets(passageHtml, passageAssets = []) {
  const embeddedSources = Array.from(
    (passageHtml || "").matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi),
    (match) => match[1],
  );
  const embeddedFileNames = new Set(
    embeddedSources.map((source) =>
      source.split(/[?#]/)[0].split("/").pop(),
    ),
  );

  return passageAssets.filter((asset) => {
    const fileName = asset.split(/[?#]/)[0].split("/").pop();
    return !embeddedFileNames.has(fileName);
  });
}

/**
 * Màn hình làm bài TOEIC.
 *
 * Hỗ trợ full test có đồng hồ đếm ngược và luyện Part có thể chấm ngay.
 */
function TestRunPage({ attemptId, go }) {
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [activePartNumber, setActivePartNumber] = useState(null);
  const [visitedDirectionParts, setVisitedDirectionParts] = useState([]);
  const [failedDirectionImage, setFailedDirectionImage] = useState("");
  const [audioIndex, setAudioIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [submitPromptOpen, setSubmitPromptOpen] = useState(false);
  const activeRef = useRef(null);
  const questionPanelRef = useRef(null);
  const audioRef = useRef(null);
  const autoSubmitted = useRef(false);
  const exitActionRef = useRef(null);
  const allowNextPopRef = useRef(false);
  const completingAttemptRef = useRef(false);
  // Khôi phục attempt và các đáp án đã lưu trước đó.
  useEffect(() => {
    assessmentService
      .getAttempt(attemptId)
      .then((d) => {
        setData(d);
        const savedDraft = JSON.parse(
          localStorage.getItem(`toeiclab-attempt-${attemptId}`) || "{}",
        );
        setVisitedDirectionParts(savedDraft.visitedDirectionParts || []);
        const old = { ...(savedDraft.answers || {}) };
        d.questions.forEach((q) => {
          if (q.selected_answer) {
            old[q.id] = q.selected_answer;
          }
        });
        setAnswers(old);
        setIndex(d.current_question_index ?? savedDraft.index ?? 0);
      })
      .catch((e) => setError(e.message));
  }, [attemptId]);
  // Đồng hồ chỉ chạy với full test có giới hạn thời gian.
  useEffect(() => {
    if (
      !data ||
      !data.time_limit_seconds ||
      (data.mode === "full" && !data.exam_started_at)
    ) return;
    const deadline = data.deadline_at
      ? new Date(data.deadline_at).getTime()
      : new Date(data.exam_started_at || data.started_at).getTime() + data.time_limit_seconds * 1000;
    const tick = () => {
      setSeconds(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      setTimerReady(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);
  // Tự động nộp bài khi hết giờ.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    if (data) {
      const draftKey = `toeiclab-attempt-${attemptId}`;
      const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "{}");
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...savedDraft,
          index,
          answers,
          visitedDirectionParts,
        }),
      );
    }
  }, [answers, attemptId, data, index, visitedDirectionParts]);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    if (
      !timerReady ||
      seconds > 0 ||
      !data ||
      data.mode === "part" ||
      data.status !== "in_progress" ||
      autoSubmitted.current
    )
      return;
    autoSubmitted.current = true;
    assessmentService
      .submitAttempt(attemptId)
      .then(() => {
        localStorage.removeItem(`toeiclab-attempt-${attemptId}`);
        completingAttemptRef.current = true;
        go(`/tests/${data.exam.slug}/result/${attemptId}`);
      })
      .catch((e) => setError(e.message));
  }, [timerReady, seconds, data, attemptId, go]);
  const questions = useMemo(() => data?.questions || [], [data]);
  const q = questions[index];
  const full = data?.mode === "full";
  const fullTestStarted = Boolean(data?.exam_started_at);
  const currentDirection = data?.directions?.find(
    (direction) => direction.part_number === q?.part_number,
  );
  const waitingForPartStart = Boolean(
    full &&
      q &&
      (!fullTestStarted ||
        (activePartNumber !== q.part_number &&
          !visitedDirectionParts.includes(q.part_number))),
  );
  const showQuestionSidebar = !full || q?.part_number >= 5;
  const sidebarQuestions = questions.filter((question) =>
    data?.mode === "subset"
      ? question.part_number === q?.part_number
      : !full || question.part_number >= 5,
  );
  const audioTracks = [...new Set(q?.audio_files || [])];
  const activeAudioSource = audioTracks[audioIndex] || "";
  const partQs = q
    ? questions.filter((x) => x.part_number === q.part_number)
    : [];
  const group =
    q && [6, 7].includes(q.part_number)
      ? partQs.filter((x) => x.passage_id === q.passage_id)
      : [3, 4].includes(q?.part_number)
        ? partQs.filter((x) => x.question === q.question)
        : [q];
  const groupLastQuestionId = group.at(-1)?.id;
  const additionalPassageAssets = getAdditionalPassageAssets(
    q?.passage_html,
    q?.passage_assets,
  );
  const isReadingPart = [6, 7].includes(q?.part_number);
  const useGroupedReadingLayout =
    isReadingPart && (group.length > 1 || data?.mode === "subset");
  useEffect(() => {
    if (!full) return undefined;
    document.body.classList.add("toeic-full-test-active");
    return () => document.body.classList.remove("toeic-full-test-active");
  }, [full]);

  useEffect(() => {
    if (
      !full ||
      !fullTestStarted ||
      waitingForPartStart ||
      data?.status !== "in_progress"
    ) {
      return undefined;
    }

    document.body.classList.add("toeic-full-test-running");
    return () => document.body.classList.remove("toeic-full-test-running");
  }, [data?.status, full, fullTestStarted, waitingForPartStart]);

  /** Guard accidental navigation away from an unfinished full-test attempt. */
  useEffect(() => {
    if (!full || data?.status !== "in_progress") return undefined;

    const guardedUrl = window.location.href;
    const confirmBrowserBack = (event) => {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        return;
      }
      if (completingAttemptRef.current) return;

      // Prevent React Router from leaving before the learner confirms.
      event.stopImmediatePropagation();
      window.history.pushState({ toeicTestGuard: true }, "", guardedUrl);
      exitActionRef.current = () => {
        allowNextPopRef.current = true;
        window.history.back();
      };
      setExitPromptOpen(true);
    };
    const confirmPageUnload = (event) => {
      if (completingAttemptRef.current) return undefined;
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("popstate", confirmBrowserBack, true);
    window.addEventListener("beforeunload", confirmPageUnload);
    return () => {
      window.removeEventListener("popstate", confirmBrowserBack, true);
      window.removeEventListener("beforeunload", confirmPageUnload);
    };
  }, [data?.status, full]);

  /** Open confirmation before following an in-app link out of a full test. */
  const requestExit = (exitAction) => {
    if (!full || data?.status !== "in_progress") {
      exitAction();
      return;
    }

    exitActionRef.current = exitAction;
    setExitPromptOpen(true);
  };

  const cancelExit = () => {
    exitActionRef.current = null;
    setExitPromptOpen(false);
  };

  const confirmExit = () => {
    const exitAction = exitActionRef.current;
    exitActionRef.current = null;
    setExitPromptOpen(false);
    exitAction?.();
  };
  /**
   * Lưu đáp án ngay sau khi người dùng chọn.
   */
  const choose = async (questionId, letter) => {
    const next = { ...answers, [questionId]: letter };
    setAnswers(next);
    setChecked((old) => {
      const fresh = { ...old };
      delete fresh[questionId];
      return fresh;
    });
    try {
      await assessmentService.saveAnswers(attemptId, { [questionId]: letter });
    } catch (e) {
      setError(e.message);
    }
  };
  /**
   * Chấm nhóm câu hiện tại trong chế độ luyện Part.
   */
  const checkCurrent = async () => {
    const values = {};
    group.forEach((x) => {
      if (answers[x.id]) values[x.id] = answers[x.id];
    });
    if (!Object.keys(values).length) {
      setError("Choose an answer before checking.");
      return;
    }
    try {
      const result = await assessmentService.saveAnswers(
        attemptId,
        values,
        true,
      );
      setChecked((old) => ({
        ...old,
        ...Object.fromEntries(result.checked.map((x) => [x.question_id, x])),
      }));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  /**
   * Nộp bài thủ công sau khi người dùng xác nhận.
   */
  const submit = async () => {
    setSubmitPromptOpen(false);
    setBusy(true);
    try {
      await assessmentService.submitAttempt(attemptId);
      localStorage.removeItem(`toeiclab-attempt-${attemptId}`);
      completingAttemptRef.current = true;
      go(`/tests/${data.exam.slug}/result/${attemptId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (_) {}
  };

  /**
   * Starts the first part and backend timer, or opens the next part's directions.
   * The full-test deadline is created once at Part 1 and continues across later parts.
   *
   * @param {number} partNumber Part containing the current question.
   */
  const beginPart = async (partNumber) => {
    setStarting(true);
    setError("");

    try {
      if (!fullTestStarted) {
        const startedAttempt = await assessmentService.startFullTest(attemptId);
        setData(startedAttempt);
      }

      setActivePartNumber(partNumber);
      setVisitedDirectionParts((visited) =>
        visited.includes(partNumber) ? visited : [...visited, partNumber],
      );
      setAudioIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStarting(false);
    }
  };

  /** Move to another question and discard any pending audio transition. */
  const progressSaveQueue = useRef(Promise.resolve());
  const moveToQuestion = useCallback((nextIndex) => {
    const nextQuestionIndex = Math.max(
      0,
      Math.min(nextIndex, questions.length - 1),
    );

    setAudioIndex(0);
    setIndex(nextQuestionIndex);
    questionPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    if (full && data?.exam_started_at) {
      progressSaveQueue.current = progressSaveQueue.current
        .catch(() => undefined)
        .then(() =>
          assessmentService.saveProgress(attemptId, nextQuestionIndex),
        )
        .catch((requestError) => setError(requestError.message));
    }
  }, [attemptId, data?.exam_started_at, full, questions.length]);

  /** Find the next playback unit; Parts 3 and 4 advance after a complete audio set. */
  const getNextAudioQuestionIndex = useCallback(() => {
    if ([3, 4].includes(q?.part_number) && groupLastQuestionId) {
      const lastGroupIndex = questions.findIndex(
        (question) => question.id === groupLastQuestionId,
      );
      return lastGroupIndex + 1;
    }
    return index + 1;
  }, [groupLastQuestionId, index, q?.part_number, questions]);

  // Autoplay each listening question during full tests without showing controls.
  useEffect(() => {
    if (
      !full ||
      !fullTestStarted ||
      !q ||
      q.part_number !== activePartNumber ||
      q.part_number > 4 ||
      !activeAudioSource
    ) {
      return undefined;
    }

    const audioElement = audioRef.current;
    if (!audioElement) return undefined;

    audioElement.currentTime = 0;
    const playRequest = audioElement.play();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(() => {
        setError("Audio could not play automatically. Check your browser's media permissions and reload the test.");
      });
    }
    return undefined;
  }, [activeAudioSource, activePartNumber, full, fullTestStarted, q]);

  const handleAudioEnded = () => {
    if (audioIndex + 1 < audioTracks.length) {
      setAudioIndex((currentIndex) => currentIndex + 1);
      return;
    }
    moveToQuestion(getNextAudioQuestionIndex());
  };

  /**
   * Tạo class cho một lựa chọn đáp án dựa trên trạng thái hiện tại.
   */
  const getOptionClassName = (item, letter) => {
    const result = checked[item.id];
    const isSelected = answers[item.id] === letter;
    const isCorrectAnswer = result?.correct_answer === letter;
    const isWrongAnswer = result && isSelected && !result.is_correct;

    return [
      "run-option",
      isSelected && "selected",
      isCorrectAnswer && "right-answer",
      isWrongAnswer && "wrong-answer",
    ]
      .filter(Boolean)
      .join(" ");
  };

  if (!data) return <Loading label="Loading test..." />;
  const listening = q.part_number <= 4;
  const fullTestAudioPlayback = full && listening;
  const timeText = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const optionBlock = (item) => {
    const result = checked[item.id];
    const questionStem = String(item.title || "").replace(/^\s*\d+\s*[.)]?\s*/, "");
    const showQuestionPrompt = [3, 4, 5, 6, 7].includes(item.part_number)
      && Boolean(questionStem.trim());

    return (
      <div className="run-answer" key={item.id}>
        <div className="run-question-label">
          Question <b>{item.number}.</b>
        </div>
        {showQuestionPrompt && (
          <div className="run-question-stem">
            <p>{questionStem}</p>
          </div>
        )}
        {Object.entries(item.options || {}).map(([letter, text]) => (
          <button
            key={letter}
            className={getOptionClassName(item, letter)}
            aria-label={`Select answer ${letter}`}
            onClick={() => choose(item.id, letter)}
          >
            <span>{letter}</span>
            <b>
              {[1, 2].includes(item.part_number) ? (result ? text : "") : text}
            </b>
          </button>
        ))}
        {result && (
          <div
            className={`inline-explanation ${result.is_correct ? "good" : "bad"}`}
          >
            <b>{result.is_correct ? "✓ Correct" : "✕ Incorrect"}</b>
            <p>{result.explanation?.reason}</p>
            {result.explanation?.tip && (
              <small>Tip: {result.explanation.tip}</small>
            )}
          </div>
        )}
      </div>
    );
  };

  const audioControlsPanel = !full && listening ? (
    <div className="audio-panel">
      <span className="audio-label">AUDIO</span>
      {[...new Set(q?.audio_files || [])].map((src) => (
        <audio controls preload="none" key={src} src={src}>
          Your browser does not support audio.
        </audio>
      ))}
      {(!q?.audio_files || !q.audio_files.length) && (
        <small>No audio file is available for this question.</small>
      )}
    </div>
  ) : null;
  const controlsInAnswerColumn = data.mode === "subset" && q.part_number === 1;
  const passageGroupNavigation = full && [6, 7].includes(q?.part_number);
  const getNavigationTargetIndex = (direction) => {
    if (!passageGroupNavigation) {
      const targetIndex = index + (direction === "next" ? 1 : -1);
      return targetIndex >= 0 && targetIndex < questions.length
        ? targetIndex
        : null;
    }

    const currentGroupIndices = group.map((question) =>
      questions.findIndex((item) => item.id === question.id),
    );
    const boundaryIndex = direction === "next"
      ? Math.max(...currentGroupIndices) + 1
      : Math.min(...currentGroupIndices) - 1;
    if (boundaryIndex < 0 || boundaryIndex >= questions.length) return null;

    const boundaryQuestion = questions[boundaryIndex];
    if (![6, 7].includes(boundaryQuestion.part_number)) return boundaryIndex;

    return questions.findIndex(
      (question) =>
        question.part_number === boundaryQuestion.part_number &&
        question.passage_id === boundaryQuestion.passage_id,
    );
  };
  const previousTargetIndex = getNavigationTargetIndex("previous");
  const nextTargetIndex = getNavigationTargetIndex("next");
  const examControls = (
    <div
      className={`exam-controls ${controlsInAnswerColumn ? "exam-controls-in-column" : ""}`}
    >
      {!fullTestAudioPlayback && (
        <Button
          kind="outline"
          disabled={previousTargetIndex === null}
          onClick={() => moveToQuestion(previousTargetIndex)}
        >
          <ArrowIcon direction="left" />
          {passageGroupNavigation ? "Previous Questions" : "Previous Question"}
        </Button>
      )}
      <div className="control-center">
        {!full && (
          <Button kind="soft" onClick={checkCurrent}>
            Check Answer
          </Button>
        )}
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
      {fullTestAudioPlayback ? null : nextTargetIndex !== null ? (
        <Button onClick={() => moveToQuestion(nextTargetIndex)}>
          {passageGroupNavigation ? "Next Questions" : "Next Question"} <ArrowIcon />
        </Button>
      ) : (
        <Button kind="danger" onClick={() => setSubmitPromptOpen(true)}>
          {full ? "Submit Test" : "Complete Part"}
        </Button>
      )}
    </div>
  );

  const exitDialog = (
    <Modal
      open={exitPromptOpen}
      title="Leave the test?"
      onClose={cancelExit}
      closeLabel="Close"
    >
      <p>
        Your work is saved, so you can continue later. Are you sure you want to
        leave this test?
      </p>
      <div className="dialog-actions">
        <Button kind="outline" onClick={cancelExit}>
          Continue Test
        </Button>
        <Button kind="danger" onClick={confirmExit}>
          Leave Test
        </Button>
      </div>
    </Modal>
  );
  const submitDialog = (
    <Modal
      open={submitPromptOpen}
      title="Submit this test?"
      onClose={() => setSubmitPromptOpen(false)}
      closeLabel="Close"
    >
      <div className="submit-confirmation">
        <div className="submit-confirmation-icon" aria-hidden="true">
          !
        </div>
        <p>
          You’re about to submit your answers. You won’t be able to change them
          after submitting.
        </p>
        <div className="submit-confirmation-count">
          {Object.keys(answers).length} of {questions.length} questions answered
        </div>
      </div>
      <div className="dialog-actions">
        <Button kind="outline" onClick={() => setSubmitPromptOpen(false)}>
          Keep Working
        </Button>
        <Button kind="danger" disabled={busy} onClick={submit}>
          {busy ? "Submitting…" : "Submit Test"}
        </Button>
      </div>
    </Modal>
  );

  if (waitingForPartStart) {
    const isListeningPart = q.part_number <= 4;

    return (
      <div className="exam-shell exam-directions-screen">
        {exitDialog}
        <main className="exam-directions-content">
          <div className="exam-directions-brand">
            <img className="brand-logo" src="/logo.png" alt="TOEICLab" />
            <span>{data.exam.title} · Full Test</span>
          </div>
          <div className="exam-directions-copy">
            <div className="eyebrow">
              {isListeningPart ? "LISTENING TEST" : "READING TEST"}
            </div>
            <section className="exam-direction-section" key={q.part_number}>
              <h1>{currentDirection?.title || `Part ${q.part_number}`}</h1>
              {currentDirection?.direction_html ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: safeMarkup(currentDirection.direction_html),
                  }}
                />
              ) : (
                <p>Read the instructions before starting Part {q.part_number}.</p>
              )}
              {currentDirection?.image &&
                failedDirectionImage !== currentDirection.image && (
                  <img
                    className="exam-direction-image"
                    src={currentDirection.image}
                    alt={`Part ${q.part_number} illustration`}
                    onError={() =>
                      setFailedDirectionImage(currentDirection.image)
                    }
                  />
                )}
              {currentDirection?.example_html && (
                <div
                  className="exam-direction-example"
                  dangerouslySetInnerHTML={{
                    __html: safeMarkup(currentDirection.example_html),
                  }}
                />
              )}
            </section>
          </div>
          <Notice error={error} />
          <div className="exam-directions-actions">
            <span>
              {fullTestStarted
                ? "The test timer continues while you read these instructions."
                : "The test timer starts when you begin Part 1."}
            </span>
            <Button disabled={starting} onClick={() => beginPart(q.part_number)}>
              {starting ? "Starting…" : `Start Part ${q.part_number}`}
              <ArrowIcon />
            </Button>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className={`exam-shell ${fullscreen ? "exam-fullscreen" : ""}`}>
      {exitDialog}
      {submitDialog}
      <header className="exam-header">
        <button
          className="exam-brand"
          onClick={() => requestExit(() => go("/tests"))}
        >
          <img className="brand-logo" src="/logo.png" alt="TOEICLab" />
          <span>
              <b><span className="brand-word-toeic">TOEIC</span><span className="brand-word-lab">Lab</span></b>
            <small>
              {data.exam.title} ·{" "}
              {full ? "Full Test" : `Part ${q?.part_number || ""}`}
            </small>
          </span>
        </button>
        <div className="exam-header-status">
          {full && <strong className="exam-timer">{timeText}</strong>}
          <button className="exam-tool" onClick={toggleFullscreen}>
            ⛶ {fullscreen ? "Exit Full Screen" : "Full Screen"}
          </button>
          {full && (
            <Button
              kind="danger"
              disabled={busy}
              onClick={() => setSubmitPromptOpen(true)}
            >
              {busy ? "Submitting…" : "Submit Test"}
            </Button>
          )}
        </div>
      </header>
      <div className={`exam-workspace ${full ? "exam-workspace-full-test" : ""} ${full && showQuestionSidebar ? "exam-workspace-has-sidebar" : ""}`}>
        {showQuestionSidebar && <aside className="exam-sidebar">
          <div className="exam-sidebar-heading">
            <b>Questions</b>
            <small>
              {sidebarQuestions.filter((question) => answers[question.id]).length}
              {" / "}
              {sidebarQuestions.length} answered
            </small>
          </div>
          {Array.from({ length: 7 }, (_, i) => i + 1)
            .filter((part) => data.mode !== "subset" || part === q?.part_number)
            .map((part) => (
            <div className="exam-part-nav" key={part}>
              <div className="exam-part-title">
                Part {part}
                <small>{englishPartNames[part - 1]}</small>
              </div>
              <div className="question-number-grid">
                {questions
                  .filter((x) => x.part_number === part && (!full || x.part_number >= 5))
                  .map((item) => {
                    const indexOf = questions.findIndex(
                      (x) => x.id === item.id,
                    );
                    return (
                      <button
                        ref={indexOf === index ? activeRef : null}
                        key={item.id}
                        className={`${indexOf === index ? "current" : ""} ${answers[item.id] ? "answered" : ""}`}
                        onClick={() => moveToQuestion(indexOf)}
                      >
                        {item.number}
                      </button>
                    );
                  })}
              </div>
            </div>
            ))}
        </aside>}
        <div className="exam-main">
          <div className="exam-progress-heading">
            <div>
              <div className="eyebrow">
                {listening ? "LISTENING" : "READING"} · PART {q?.part_number}
              </div>
              <h1>
                Part {q?.part_number}: {englishPartNames[(q?.part_number || 1) - 1]}
              </h1>
            </div>
            {/* <span>
              Question {q?.number}
              {full && [3, 4].includes(q?.part_number) && group.length > 1
                ? `–${group.at(-1).number}`
                : ""}
              <i> / {questions.length}</i>
            </span> */}
          </div>
          {listening && full && activeAudioSource && (
            <audio
              ref={audioRef}
              className="exam-hidden-audio"
              key={`${q.id}-${activeAudioSource}`}
              src={activeAudioSource}
              preload="auto"
              onEnded={handleAudioEnded}
            />
          )}
          {q.part_number !== 1 && audioControlsPanel}
          <div
            className={`question-layout ${isReadingPart ? "reading-layout" : ""} ${useGroupedReadingLayout ? "grouped-reading-layout" : ""} ${data.mode === "subset" && isReadingPart ? "subset-reading-layout" : ""} ${data.mode === "subset" && q?.part_number === 6 ? "subset-part-six-layout" : ""} ${q?.part_number === 1 && q?.image_files?.length ? "listening-image-layout" : ""}`}
          >
            {q.part_number === 1 && q.image_files?.length > 0 && (
              <section className="listening-image-panel">
                <div className="eyebrow">LISTENING IMAGE</div>
                {audioControlsPanel}
                {q.image_files.map((src) => (
                  <img
                    className="question-image"
                    src={src}
                    alt={`Question ${q.number}`}
                    key={src}
                  />
                ))}
              </section>
            )}
            {[6, 7].includes(q?.part_number) && (
              <section className="passage-panel">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">READING PASSAGE</div>
                    <h2>Reading Passage</h2>
                  </div>
                  <span>Part {q.part_number}</span>
                </div>
                {q.passage_html ? (
                  <div
                    className="passage-copy"
                    dangerouslySetInnerHTML={{
                      __html: safeMarkup(q.passage_html),
                    }}
                  />
                ) : q.part_number === 6 ? (
                  <div className="passage-copy">{q.question}</div>
                ) : null}
                {additionalPassageAssets.map((src) => (
                  <img key={src} src={src} alt="Reading passage" />
                ))}
              </section>
            )}
            <section className="question-panel" ref={questionPanelRef}>
              <div className="question-panel-title">
                <span>
                  {q.part_number === 1
                    ? "Look at the picture and choose the description that matches."
                    : q.part_number === 2
                      ? "Listen to the question and choose the appropriate response."
                      : q.part_number === 5
                        ? "Choose the word or phrase that best completes the sentence."
                        : group.length > 1
                          ? `Questions ${q.number}–${group.at(-1)?.number || q.number}`
                          : `Question ${q.number}`}
                </span>
                <span>
                  {group.filter((x) => answers[x.id]).length}/{group.length}
                </span>
              </div>
              {[6, 7].includes(q.part_number) || [3, 4].includes(q.part_number)
                ? group.map(optionBlock)
                : optionBlock(q)}
              {controlsInAnswerColumn && examControls}
            </section>
          </div>
          {!controlsInAnswerColumn && examControls}
          <Notice error={error} />
        </div>
      </div>
    </div>
  );
}

export default TestRunPage;
