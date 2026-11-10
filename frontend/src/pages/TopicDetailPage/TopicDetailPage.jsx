import React, { useEffect, useState } from "react";
import "./TopicDetailPage.scss";
import WordGrid from "../../components/vocabulary/WordGrid/WordGrid";
import vocabularyService from "../../services/vocabularyService";
import quizService from "../../services/quizService";
import { ArrowIcon, Button, Loading, Notice, SectionTitle } from "../../shared/ui";

/**
 * Trang chi tiết chủ đề, tìm kiếm từ và cập nhật trạng thái đã học.
 */
function TopicDetailPage({ slug, go, openLogin }) {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  // Tải dữ liệu khi người dùng chuyển sang chủ đề khác.
  useEffect(() => {
    setLoading(true);
    vocabularyService
      .getTopic(slug)
      .then(setTopic)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);
  const startTopicQuiz = async () => {
    if (!topic?.id || startingQuiz) return;

    setStartingQuiz(true);
    setError("");
    try {
      const quiz = await quizService.createVocabularyQuiz({
        scope: "topic",
        topic_id: topic.id,
        question_types: ["vi_to_en", "en_to_vi"],
      });
      go(`/vocabulary/quiz/${quiz.id}`);
    } catch (requestError) {
      if (requestError.message.includes("Đăng nhập")) {
        openLogin?.();
      } else {
        setError(requestError.message);
      }
    } finally {
      setStartingQuiz(false);
    }
  };
  const words = (topic?.words || []).filter(
    (w) =>
      w.word.toLowerCase().includes(query.toLowerCase()) ||
      w.meaning_vi.toLowerCase().includes(query.toLowerCase()),
  );
  if (loading) return <Loading />;
  return (
    <>
      <div className="back-row">
        <button className="text-button" onClick={() => go("/vocabulary")}>
          <ArrowIcon direction="left" /> Tất cả chủ đề
        </button>
      </div>
      <SectionTitle
        eyebrow="VOCABULARY TOPIC"
        title={topic?.name || slug}
        description={`${topic?.words?.length || 0} từ vựng TOEIC · Hình ảnh, phát âm và câu ví dụ`}
        action={
          <Button onClick={startTopicQuiz} disabled={startingQuiz || !topic?.id}>
            {startingQuiz ? "Đang tạo quiz…" : "Làm quiz ngay"} <ArrowIcon />
          </Button>
        }
      />
      <Notice error={error} />
      <div className="toolbar topic-toolbar">
        <div>
          <h2>
            Thẻ từ <small>{words.length} từ</small>
          </h2>
          <p>Đánh dấu ✓ khi đã ghi nhớ từ này.</p>
        </div>
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm từ hoặc nghĩa…"
          />
        </div>
      </div>
      <WordGrid words={words} />
    </>
  );
}

export default TopicDetailPage;
