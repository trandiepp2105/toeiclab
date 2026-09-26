import React, { useEffect, useState } from "react";
import TopicGrid from "../../components/vocabulary/TopicGrid/TopicGrid";
import vocabularyService from "../../services/vocabularyService";
import { ArrowIcon, Button, Loading, SectionTitle } from "../../shared/ui";
import "./VocabularyHomePage.scss";

/**
 * Trang danh sách chủ đề từ vựng và điểm bắt đầu quiz.
 */
function VocabularyHomePage({ go }) {
  const [topics, setTopics] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  // Tải danh sách chủ đề một lần khi mở trang.
  useEffect(() => {
    vocabularyService
      .listTopics()
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);
  const filtered = topics.filter((x) =>
    x.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <SectionTitle
        eyebrow="VOCABULARY STUDIO"
        title="Học từ vựng TOEIC"
        description="600 từ thiết yếu, chia theo chủ đề — có IPA, ví dụ, hình ảnh và audio phát âm."
        action={
          <Button onClick={() => go("/vocabulary/quiz")}>
            ✦ Kiểm tra từ vựng
          </Button>
        }
      />
      <div className="vocab-banner">
        <div>
          <span className="eyebrow light">LEARN A LITTLE. REMEMBER A LOT.</span>
          <h2>
            Từ mới hôm nay,
            <br />
            điểm số ngày mai.
          </h2>
          <p>Học với thẻ từ trực quan hoặc tự kiểm tra bằng quiz song ngữ.</p>
          <Button kind="white" onClick={() => go("/vocabulary/quiz")}>
            Bắt đầu quiz <ArrowIcon />
          </Button>
        </div>
        <div className="banner-word">
          <small>WORD OF THE DAY</small>
          <b>negotiate</b>
          <span>/nɪˈɡəʊʃieɪt/</span>
          <em>đàm phán</em>
          <div className="word-stars">✦ ✦ ✦</div>
        </div>
      </div>
      <div className="toolbar">
        <div>
          <h2>
            Chủ đề từ vựng <small>{topics.length} chủ đề</small>
          </h2>
          <p>Chọn một chủ đề để xem thẻ từ và bắt đầu học.</p>
        </div>
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm chủ đề…"
          />
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <div className="empty-state panel">
          <span>⌕</span>
          <h3>Không tìm thấy chủ đề</h3>
          <p>Thử tìm bằng tên chủ đề khác.</p>
        </div>
      ) : (
        <TopicGrid
          topics={filtered}
          onSelect={(topic) => go(`/vocabulary/topics/${topic.slug}`)}
        />
      )}
    </>
  );
}

export default VocabularyHomePage;
