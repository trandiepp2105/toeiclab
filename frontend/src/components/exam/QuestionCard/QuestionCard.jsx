import React from "react";

import AnswerOption from "../AnswerOption/AnswerOption";
import AnswerExplanation from "../AnswerExplanation/AnswerExplanation";

/**
 * Card câu hỏi TOEIC, gồm prompt, lựa chọn và lời giải.
 */
function QuestionCard({ question, selectedAnswer, checked, onSelect }) {
  return (
    <article className="run-answer">
      <div className="run-question-label">
        Câu hỏi <b>{question.number}.</b>
      </div>
      {Object.entries(question.options || {}).map(([key, text]) => {
        const isSelected = selectedAnswer === key;
        const isCorrect = checked?.correct_answer === key;
        const isWrong = checked && isSelected && !checked.is_correct;

        return (
          <AnswerOption
            key={key}
            optionKey={key}
            text={text}
            selected={isSelected}
            correct={isCorrect}
            wrong={isWrong}
            onSelect={() => onSelect(question.id, key)}
          />
        );
      })}
      {checked && (
        <AnswerExplanation
          isCorrect={checked.is_correct}
          correctAnswer={checked.correct_answer}
          explanation={checked.explanation}
        />
      )}
    </article>
  );
}

export default QuestionCard;
