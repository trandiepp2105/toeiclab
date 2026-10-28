import React from "react";
import { readFileSync } from "fs";
import path from "path";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PartPracticeRunPage from "./PartPracticeRunPage";
import practiceService from "../../services/practiceService";

jest.mock("../../services/practiceService", () => ({
  __esModule: true,
  default: {
    getPartQuestions: jest.fn(),
    savePartProgress: jest.fn(() => Promise.resolve()),
    checkAnswers: jest.fn(),
  },
}));

const makeQuestion = (id, media = {}) => ({
  id,
  number: id,
  title: `Question ${id}`,
  options: { A: "Option A", B: "Option B" },
  ...media,
});

const makeGroup = (question, passageHtml = "") => ({
  exam: { title: "Sample exam" },
  questions: [{ ...question, passage_html: passageHtml }],
});

const makePartData = (groups) => ({
  total_questions: groups.length,
  question_offset: 0,
  has_next: false,
  has_previous: false,
  groups,
});

describe("PartPracticeRunPage media behavior", () => {
  let originalWidth;
  let originalPlay;
  let originalScrollIntoView;

  beforeEach(() => {
    jest.clearAllMocks();
    practiceService.savePartProgress.mockResolvedValue(undefined);
    originalWidth = window.innerWidth;
    originalPlay = window.HTMLMediaElement.prototype.play;
    originalScrollIntoView = Element.prototype.scrollIntoView;
    window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    window.HTMLMediaElement.prototype.play = originalPlay;
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  test("autoplays the audio when opening a listening question and when moving to the next one", async () => {
    window.innerWidth = 1024;
    const first = makeGroup(makeQuestion(1, { audio_files: ["/audio/first.mp3"] }));
    const second = makeGroup(makeQuestion(2, { audio_files: ["/audio/second.mp3"] }));
    practiceService.getPartQuestions.mockResolvedValue(makePartData([first, second]));

    const { container } = render(<PartPracticeRunPage partNumber={2} go={jest.fn()} />);

    await waitFor(() => expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1));
    expect(container.querySelector("audio")).toHaveAttribute("src", "/audio/first.mp3");

    fireEvent.click(screen.getByRole("button", { name: /Câu tiếp theo/ }));

    await waitFor(() => expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2));
    expect(container.querySelector("audio")).toHaveAttribute("src", "/audio/second.mp3");
  });

  test("scrolls the active passage to the top on mobile when opening a reading question", async () => {
    window.innerWidth = 390;
    practiceService.getPartQuestions.mockResolvedValue(
      makePartData([makeGroup(makeQuestion(147), "<p>Reading passage</p>")]),
    );

    const { container } = render(<PartPracticeRunPage partNumber={7} go={jest.fn()} />);

    const passage = await screen.findByText("Reading passage");
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
    expect(container.querySelector(".practice-passage")).toContainElement(passage);
  });

  test("scrolls the active image to the top on mobile when opening a picture question", async () => {
    window.innerWidth = 390;
    practiceService.getPartQuestions.mockResolvedValue(
      makePartData([makeGroup(makeQuestion(1, { image_files: ["/images/question.jpg"] }))]),
    );

    const { container } = render(<PartPracticeRunPage partNumber={1} go={jest.fn()} />);

    await screen.findByRole("img", { name: "Câu 1" });
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
    expect(container.querySelector(".practice-listening-image")).toBeInTheDocument();
  });

  test("preserves line breaks in answer explanations", async () => {
    const question = makeQuestion(3);
    practiceService.getPartQuestions.mockResolvedValue(
      makePartData([makeGroup(question)]),
    );
    practiceService.checkAnswers.mockResolvedValue({
      checked: [{
        question_id: 3,
        is_correct: false,
        correct_answer: "A",
        explanation: { reason: "Câu thứ nhất.\nCâu thứ hai." },
      }],
    });

    const { container } = render(<PartPracticeRunPage partNumber={5} go={jest.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Chọn đáp án B" }));
    await screen.findByText(/Câu thứ nhất/);

    expect(container.querySelector(".practice-explanation p").textContent)
      .toBe("Câu thứ nhất.\nCâu thứ hai.");
    const styles = readFileSync(
      path.resolve(__dirname, "../PartPracticePage/PartPracticePage.scss"),
      "utf8",
    );
    expect(styles).toMatch(/\.practice-explanation p\s*\{[^}]*white-space:\s*pre-line;/s);
  });
});
