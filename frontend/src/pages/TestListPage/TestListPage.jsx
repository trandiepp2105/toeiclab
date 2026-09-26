import React, { useEffect, useState } from "react";
import TestListItem from "../../components/exam/TestListItem/TestListItem";
import examService from "../../services/examService";
import { Loading, SectionTitle } from "../../shared/ui";
import "./TestListPage.scss";

/**
 * Trang danh sách và tìm kiếm các bộ đề TOEIC.
 */
function TestListPage({ go }) {
  const [examGroups, setExamGroups] = useState([]);
  const [totalExamCount, setTotalExamCount] = useState(0);
  const [query, setQuery] = useState("");
  const [collapsedYears, setCollapsedYears] = useState(new Set());
  const [loading, setLoading] = useState(true);
  // Danh sách đề chỉ tải một lần; việc thu gọn nhóm được xử lý ở UI.
  useEffect(() => {
    setLoading(true);
    examService
      .listExams()
      .then((x) => {
        const groups = x.groups || [];
        setExamGroups(groups);
        // Mở sẵn năm mới nhất, các năm cũ thu gọn để trang dễ quét hơn.
        setCollapsedYears(
          new Set(groups.slice(1).map((group) => group.year ?? "other")),
        );
        setTotalExamCount(x.count || 0);
      })
      .catch(() => {
        setExamGroups([]);
        setTotalExamCount(0);
      })
      .finally(() => setLoading(false));
  }, []);
  /** Đảo trạng thái hiển thị của một nhóm năm. */
  const toggleYear = (year) => {
    setCollapsedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = examGroups
    .map((group) => ({
      ...group,
      exams: group.exams.filter(
        (exam) =>
          exam.title.toLowerCase().includes(normalizedQuery) ||
          exam.id.includes(normalizedQuery),
      ),
    }))
    .filter((group) => group.exams.length > 0);
  const visibleExamCount = visibleGroups.reduce(
    (count, group) => count + group.exams.length,
    0,
  );
  return (
    <>
      <SectionTitle
        eyebrow="FULL TOEIC TEST"
        title="Bài thi đầy đủ"
        description="77 bộ đề Listening & Reading. Làm bài trong điều kiện gần với kỳ thi thật."
        action={
          <span className="library-total">
            ▣ &nbsp;{totalExamCount || 77} bộ đề
          </span>
        }
      />
      <div className="test-intro">
        <span className="intro-symbol">◷</span>
        <div>
          <b>Mô phỏng bài thi 120 phút</b>
          <p>
            Chọn làm toàn bài hoặc tùy chỉnh Part muốn luyện. Kết quả có đáp án
            và giải thích từng câu.
          </p>
        </div>
        <span className="intro-parts">LISTENING 100 · READING 100</span>
      </div>
      <div className="toolbar test-toolbar">
        <span className="test-toolbar-label">Danh sách đề theo năm</span>
        <div className="test-status-legend" aria-label="Trạng thái đề thi">
          <span><i className="legend-swatch legend-completed" />Đã làm</span>
          <span><i className="legend-swatch legend-not-started" />Chưa làm</span>
        </div>
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm đề thi…"
          />
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : !visibleExamCount ? (
        <div className="empty-state panel">
          <span>⌕</span>
          <h3>Không tìm thấy đề thi</h3>
          <p>Thử thay đổi từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="test-year-groups">
          {visibleGroups.map((group) => (
            <section className="test-year-group" key={group.year ?? "other"}>
              <button
                className="test-year-heading"
                type="button"
                onClick={() => toggleYear(group.year ?? "other")}
                aria-expanded={!collapsedYears.has(group.year ?? "other")}
              >
                <span>
                  <span className="test-year-chevron">
                    {collapsedYears.has(group.year ?? "other") ? "＋" : "−"}
                  </span>
                  <strong>{group.label || group.year || "Khác"}</strong>
                </span>
                <span>{group.exams.length} bộ đề</span>
              </button>
              {!collapsedYears.has(group.year ?? "other") && (
                <div className="test-grid">
                  {group.exams.map((exam) => (
                    <TestListItem
                      key={exam.id}
                      exam={exam}
                      onSelect={() => go(`/tests/${exam.slug}/setup`)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default TestListPage;
