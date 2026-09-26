import React, { useEffect, useState } from "react";
import vocabularyService from "../../services/vocabularyService";
import quizService from "../../services/quizService";
import { ArrowIcon, Button, Notice, SectionTitle } from "../../shared/ui";
import "./VocabularyQuizSetupPage.scss";

/**
 * Trang cấu hình quiz từ vựng theo phạm vi và dạng câu hỏi.
 */
function VocabularyQuizSetupPage({ go, openLogin }) {
  const [topics, setTopics] = useState([]);
  const [scope, setScope] = useState("all");
  const [topicId, setTopicId] = useState("");
  const [count, setCount] = useState(10);
  const [types, setTypes] = useState(["vi_to_en", "en_to_vi"]);
  const [error, setError] = useState("");
  // Chủ đề được dùng khi người học chọn phạm vi một topic cụ thể.
  useEffect(() => {
    vocabularyService
      .listTopics()
      .then(setTopics)
      .catch(() => {});
  }, []);
  /**
   * Tạo quiz mới và chuyển đến màn hình làm bài.
   */
  const start = async () => {
    setError("");
    try {
      const data = await quizService.createVocabularyQuiz({
        scope,
        topic_id: scope === "topic" ? topicId : null,
        question_count: Number(count),
        question_types: types,
      });
      go(`/vocabulary/quiz/${data.id}`);
    } catch (e) {
      if (e.message.includes("Đăng nhập")) openLogin();
      else setError(e.message);
    }
  };
  const toggle = (type) =>
    setTypes((old) =>
      old.includes(type) ? old.filter((x) => x !== type) : [...old, type],
    );
  return (
    <>
      <SectionTitle
        eyebrow="VOCABULARY QUIZ"
        title="Kiểm tra từ vựng"
        description="Chọn phạm vi và hướng dịch để tạo một lượt quiz mới."
      />
      <div className="setup-layout">
        <section className="panel setup-card">
          <h2>1. Phạm vi kiểm tra</h2>
          <div className="choice-list">
            {[
              ["all", "Tất cả từ", "Ôn tập ngẫu nhiên trong bộ 600 từ"],
              ["topic", "Theo chủ đề", "Tập trung vào một chủ đề cụ thể"],
              [
                "review",
                "Từ cần ôn",
                "Ưu tiên những từ bạn thường trả lời sai",
              ],
            ].map(([value, title, sub]) => (
              <label
                className={`choice-row ${scope === value ? "selected" : ""}`}
                key={value}
              >
                <input
                  type="radio"
                  checked={scope === value}
                  onChange={() => setScope(value)}
                />
                <span>
                  <b>{title}</b>
                  <small>{sub}</small>
                </span>
              </label>
            ))}
          </div>
          {scope === "topic" && (
            <select
              className="field-select"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">Chọn chủ đề…</option>
              {topics.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <h2>2. Số câu hỏi</h2>
          <div className="count-options">
            {[10, 20, 30].map((n) => (
              <button
                className={count === n ? "selected" : ""}
                key={n}
                onClick={() => setCount(n)}
              >
                {n}
                <small>câu</small>
              </button>
            ))}
          </div>
          <h2>3. Dạng câu hỏi</h2>
          <div className="type-options">
            <label>
              <input
                type="checkbox"
                checked={types.includes("vi_to_en")}
                onChange={() => toggle("vi_to_en")}
              />{" "}
              Tiếng Việt → chọn tiếng Anh
            </label>
            <label>
              <input
                type="checkbox"
                checked={types.includes("en_to_vi")}
                onChange={() => toggle("en_to_vi")}
              />{" "}
              Tiếng Anh → chọn nghĩa tiếng Việt
            </label>
          </div>
          <Notice error={error} />
          <Button
            onClick={start}
            disabled={!types.length || (scope === "topic" && !topicId)}
          >
            Tạo bài kiểm tra <ArrowIcon />
          </Button>
        </section>
        <aside className="panel quiz-aside">
          <span className="quiz-aside-icon">✦</span>
          <h3>Hai chiều ghi nhớ</h3>
          <p>
            Quiz chỉ gồm câu hỏi dịch Việt–Anh và Anh–Việt. Không dùng audio làm
            dạng câu hỏi.
          </p>
          <div className="aside-rule" />
          <small>
            Chọn đáp án để nhận phản hồi ngay, từ trả lời sai sẽ được đưa vào
            nhóm cần ôn.
          </small>
        </aside>
      </div>
    </>
  );
}

export default VocabularyQuizSetupPage;
