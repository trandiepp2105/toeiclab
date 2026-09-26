import React, { useState } from "react";
import { partNames, safeMarkup } from "../../../shared/ui";
import ExamSidebar from "../ExamSidebar/ExamSidebar";
import AudioPlayer from "../../common/AudioPlayer/AudioPlayer";
import "./ExamAnswerTranscript.scss";

/** Keep conversation and talk questions together because they share one audio. */
function getQuestionGroupKey(question) {
  if ([6, 7].includes(question.part_number) && question.passage_id) {
    return `passage-${question.passage_id}`;
  }

  if ([3, 4].includes(question.part_number)) {
    const audioSource = question.audio_files?.[0];
    const groupLabel = audioSource || question.question || question.id;
    return `listening-${question.part_number}-${groupLabel}`;
  }

  return `question-${question.id}`;
}

/**
 * Groups adjacent questions that share a passage, avoiding repeated passage
 * content while keeping every question's answer and explanation visible.
 *
 * @param {Array<Object>} questions Serialized questions in display order.
 * @returns {Array<Object>} Passage groups or single-question groups.
 */
function groupQuestionsByPassage(questions) {
  const groups = [];
  const groupsByKey = new Map();

  questions.forEach((question) => {
    const key = getQuestionGroupKey(question);
    let group = groupsByKey.get(key);

    if (!group) {
      group = {
        key,
        passageHtml: question.passage_html,
        passageAssets: question.passage_assets || [],
        audioSources: [],
        questions: [],
      };
      groupsByKey.set(key, group);
      groups.push(group);
    }

    group.questions.push(question);
    question.audio_files?.forEach((source) => {
      if (!group.audioSources.includes(source)) {
        group.audioSources.push(source);
      }
    });
  });

  return groups;
}

/**
 * Filters passage image assets already embedded in the supplied HTML.
 *
 * @param {string} html Passage markup.
 * @param {Array<string>} assets Image URLs associated with the passage.
 * @returns {Array<string>} Assets that still need a separate image element.
 */
function getAdditionalAssets(html, assets = []) {
  const embeddedFileNames = new Set(
    Array.from(
      (html || "").matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi),
      (match) => match[1].split(/[?#]/)[0].split("/").pop(),
    ),
  );

  return assets.filter((asset) => {
    const fileName = asset.split(/[?#]/)[0].split("/").pop();
    return !embeddedFileNames.has(fileName);
  });
}

/** Render question prompt markup when available, falling back to its text. */
function QuestionPrompt({ question }) {
  const hasSharedPassage =
    [6, 7].includes(question.part_number) && Boolean(question.passage_id);
  // In imported data, the question field for Parts 5 and 7 may be a source
  // label; their actual question text is stored in title.
  const promptText = [5, 7].includes(question.part_number)
    ? question.title || question.question
    : hasSharedPassage && question.part_number === 6
      ? ""
      : question.question;
  // Parts 6–7 render this same HTML once at the shared-passage group level.
  const promptHtml = hasSharedPassage ? "" : question.content_html;
  const additionalImages = getAdditionalAssets(
    promptHtml,
    hasSharedPassage ? [] : question.image_files || [],
  );

  if (promptHtml) {
    return (
      <>
        <div
          className="answer-question-prompt answer-question-prompt-html"
          dangerouslySetInnerHTML={{ __html: safeMarkup(promptHtml) }}
        />
        {additionalImages.length > 0 && (
          <div className="answer-question-images">
            {additionalImages.map((imageUrl) => (
              <img
                src={imageUrl}
                alt={`Hình minh họa câu ${question.number}`}
                key={imageUrl}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {promptText && (
        <p className="answer-question-prompt">{promptText}</p>
      )}
      {additionalImages.length > 0 && (
        <div className="answer-question-images">
          {additionalImages.map((imageUrl) => (
            <img
              src={imageUrl}
              alt={`Hình minh họa câu ${question.number}`}
              key={imageUrl}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** Render a single question together with its answer key and explanation. */
function AnswerQuestion({ question, showTranscript = true }) {
  const options = Object.entries(question.options || {});

  return (
    <article
      className="answer-transcript-question"
      id={`answer-transcript-question-${question.id}`}
    >
      <header className="answer-transcript-question-heading">
        <h3>Câu {question.number}</h3>
        {question.correct_answer ? (
          <span className="answer-key-badge">
            Đáp án {question.correct_answer}
          </span>
        ) : (
          <span className="answer-missing-badge">Chưa có đáp án</span>
        )}
      </header>

      <QuestionPrompt question={question} />

      {options.length > 0 && (
        <ol className="answer-transcript-options">
          {options.map(([key, value]) => (
            <li
              className={key === question.correct_answer ? "correct" : ""}
              key={key}
            >
              <span className="answer-option-key">{key}</span>
              <span>{value || "—"}</span>
              {key === question.correct_answer && (
                <span className="answer-option-label">Đáp án đúng</span>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="answer-explanation">
        <h4>Giải thích</h4>
        <p>
          {question.explanation?.reason ||
            "Ngân hàng đề chưa có phần giải thích cho câu này."}
        </p>
        {question.explanation?.tip && (
          <p className="answer-explanation-tip">
            <strong>Mẹo:</strong> {question.explanation.tip}
          </p>
        )}
      </div>

      {showTranscript && question.transcript && (
        <details className="answer-transcript-copy">
          <summary>Transcript</summary>
          <p>{question.transcript}</p>
        </details>
      )}
    </article>
  );
}

/**
 * Displays a read-only answer and transcript guide for every part of an exam.
 *
 * @param {Object} props Component props.
 * @param {Object} props.data API response containing parts and questions.
 * @returns {JSX.Element} Expandable, grouped answer guide.
 */
function ExamAnswerTranscript({ data }) {
  const allQuestions = (data?.parts || []).flatMap(
    (part) => part.questions || [],
  );
  const [activeQuestionId, setActiveQuestionId] = useState(
    allQuestions[0]?.id ?? null,
  );
  const parts = data?.parts || [];
  const activeQuestionIndex = allQuestions.findIndex(
    (question) => question.id === activeQuestionId,
  );
  const totalQuestions = parts.reduce(
    (count, part) => count + (part.questions?.length || 0),
    0,
  );
  const answeredQuestions = parts.reduce(
    (count, part) =>
      count +
      (part.questions || []).filter((question) => question.correct_answer).length,
    0,
  );

  if (!totalQuestions) {
    return (
      <div className="panel answer-transcript-empty">
        Chưa có câu hỏi trong ngân hàng cho đề thi này.
      </div>
    );
  }

  /** Open the selected Part and bring the matching answer card into view. */
  function navigateToQuestion(questionIndex) {
    const question = allQuestions[questionIndex];
    if (!question) return;

    setActiveQuestionId(question.id);
    const partPanel = document.getElementById(
      `answer-transcript-part-${question.part_number}`,
    );
    if (partPanel) partPanel.open = true;

    window.requestAnimationFrame(() => {
      document
        .getElementById(`answer-transcript-question-${question.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="exam-answer-transcript-layout">
      <ExamSidebar
        questions={allQuestions}
        currentIndex={activeQuestionIndex}
        partNames={partNames}
        onSelect={navigateToQuestion}
        heading="Điều hướng câu hỏi"
        metaText={`${totalQuestions} câu · ${parts.length} Part`}
        className="answer-transcript-sidebar"
      />

      <main className="exam-answer-transcript">
        <section className="panel answer-transcript-intro">
          <div>
            <h2>Đáp án &amp; transcript</h2>
            <p>
              Xem đáp án và giải thích trực tiếp từ ngân hàng đề thi; không cần
              bắt đầu hay nộp bài.
            </p>
          </div>
          <strong>
            {answeredQuestions}/{totalQuestions} câu có đáp án
          </strong>
        </section>

        {parts.map((part) => {
          const questions = part.questions || [];
          const groups = groupQuestionsByPassage(questions);

          return (
            <details
              className="panel answer-transcript-part"
              id={`answer-transcript-part-${part.number}`}
              key={part.number}
              open={part.number === 1}
            >
              <summary>
                <span>
                  <strong>Part {part.number}</strong>
                  <span className="answer-transcript-part-name">
                    {part.title || partNames[part.number - 1]}
                  </span>
                </span>
                <small>{questions.length} câu</small>
              </summary>

              <div className="answer-transcript-part-content">
                {groups.map((group) => {
                  const additionalPassageAssets = getAdditionalAssets(
                    group.passageHtml,
                    group.passageAssets,
                  );
                  const sharedTranscripts = [
                    ...new Set(
                      group.questions
                        .map((question) => question.transcript?.trim())
                        .filter(Boolean),
                    ),
                  ];
                  const transcriptIsShared =
                    group.questions.length > 1 &&
                    sharedTranscripts.length === 1;

                return (
                  <section className="answer-transcript-group" key={group.key}>
                    {group.audioSources.length > 0 && (
                      <div className="answer-transcript-audio">
                        <strong>
                          Nghe lại audio · Part {group.questions[0].part_number}
                          {group.questions.length > 1
                            ? ` · Câu ${group.questions[0].number}–${group.questions[group.questions.length - 1].number}`
                            : ` · Câu ${group.questions[0].number}`}
                        </strong>
                        <div className="answer-transcript-audio-players">
                          {group.audioSources.map((source, index) => (
                            <AudioPlayer
                              key={source}
                              src={source}
                              label={
                                group.audioSources.length > 1
                                  ? `Audio ${index + 1}, Part ${group.questions[0].part_number}`
                                  : `Audio Part ${group.questions[0].part_number}, câu ${group.questions[0].number}`
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {(group.passageHtml || additionalPassageAssets.length > 0) && (
                        <div className="answer-transcript-passage">
                          <h3>Đoạn văn / tài liệu</h3>
                          {group.passageHtml && (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: safeMarkup(group.passageHtml),
                              }}
                            />
                          )}
                          {additionalPassageAssets.map((imageUrl) => (
                            <img
                              src={imageUrl}
                              alt="Tài liệu đề thi"
                              key={imageUrl}
                            />
                          ))}
                        </div>
                      )}

                      {transcriptIsShared && (
                        <details className="answer-transcript-copy">
                          <summary>Transcript</summary>
                          <p>{sharedTranscripts[0]}</p>
                        </details>
                      )}

                      {group.questions.map((question) => (
                        <AnswerQuestion
                          key={question.id}
                          question={question}
                          showTranscript={!transcriptIsShared}
                        />
                      ))}
                    </section>
                  );
                })}
              </div>
            </details>
          );
        })}
      </main>
    </div>
  );
}

export default ExamAnswerTranscript;
