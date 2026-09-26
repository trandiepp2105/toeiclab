import React, { useEffect, useState } from "react";
import practiceService from "../../services/practiceService";
import { ArrowIcon, Loading, SectionTitle } from "../../shared/ui";
import "./PartPracticePage.scss";

const partDescriptions = {
  1: "Nghe 4 câu mô tả và chọn câu phù hợp nhất với hình ảnh.",
  2: "Nghe một câu hỏi hoặc lời nói, chọn phản hồi phù hợp nhất.",
  3: "Nghe các đoạn hội thoại và trả lời câu hỏi theo từng đoạn.",
  4: "Nghe các bài nói ngắn và trả lời câu hỏi theo từng bài.",
  5: "Chọn từ hoặc cụm từ phù hợp để hoàn thành câu.",
  6: "Đọc một đoạn văn ngắn và chọn đáp án cho từng chỗ trống.",
  7: "Đọc các văn bản liên quan rồi trả lời câu hỏi theo passage.",
};

const partModeLabels = {
  single: "Câu đơn",
  group: "Cụm câu",
};

/** Trang chọn một trong bảy Part để luyện trên toàn bộ ngân hàng đề. */
function PartPracticePage({ go }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    practiceService
      .listParts()
      .then(setParts)
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, []);

  const renderPartCard = (part) => (
    <button
      className="practice-part-card"
      key={part.part_number}
      type="button"
      onClick={() => go(`/parts/${part.part_number}`)}
    >
      <span className="practice-part-number">
        PART {String(part.part_number).padStart(2, "0")}
      </span>
      <strong>{part.name}</strong>
      <p>{part.description || partDescriptions[part.part_number]}</p>
      <span className="practice-part-footer">
        <span>{part.question_count} câu</span>
        {/* <span>{partModeLabels[part.practice_mode]} <ArrowIcon /></span> */}
      </span>
    </button>
  );

  if (loading) return <Loading />;

  return (
    <>
      <SectionTitle
        eyebrow="PART PRACTICE"
        title="Luyện tập từng phần"
        description="Chọn một Part để luyện tập riêng. Câu hỏi được lấy từ toàn bộ ngân hàng đề và sắp xếp từ đề mới nhất đến cũ nhất."
      />
      <div className="part-practice-intro">
        <span className="intro-symbol">◷</span>
        <div>
          <b>Luyện liên tục trên toàn bộ ngân hàng đề</b>
          <p>
            Khi hoàn thành câu hỏi cuối cùng, hệ thống sẽ quay lại câu đầu tiên
            để bạn tiếp tục ôn tập.
          </p>
        </div>
      </div>
      <section className="practice-part-section">
        <div className="practice-section-label">LISTENING · 100 CÂU / ĐỀ</div>
        <div className="practice-part-grid">
          {parts.filter((part) => part.part_number <= 4).map(renderPartCard)}
        </div>
      </section>
      <section className="practice-part-section">
        <div className="practice-section-label">READING · 100 CÂU / ĐỀ</div>
        <div className="practice-part-grid">
          {parts.filter((part) => part.part_number >= 5).map(renderPartCard)}
        </div>
      </section>
    </>
  );
}

export default PartPracticePage;
