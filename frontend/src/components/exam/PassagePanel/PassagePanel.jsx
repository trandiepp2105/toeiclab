import React from "react";

/**
 * Panel hiển thị passage và tài nguyên hình ảnh của Part 6–7.
 */
function PassagePanel({ html, assets = [], title = "Đoạn văn" }) {
  return (
    <section className="passage-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {html ? (
        <div
          className="passage-copy"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="passage-copy">Chưa có nội dung passage.</div>
      )}
      {assets.map((src) => (
        <img key={src} src={src} alt="Tài liệu câu hỏi" />
      ))}
    </section>
  );
}

export default PassagePanel;
