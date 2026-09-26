import React, { useEffect, useState } from "react";

import "./KnowledgePage.scss";
import knowledgeService from "../../../services/knowledgeService";
import { ArrowIcon, Loading, SectionTitle, partNames } from "../../../shared/ui";

/**
 * Component hiển thị nội dung kiến thức theo loại.
 *
 * @param {"grammar"|"tips"} kind - Loại nội dung cần tải.
 */
function KnowledgePage({ kind }) {
  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grammar và tips dùng endpoint riêng; tips có thêm danh sách bài viết.
  useEffect(() => {
    const request =
      kind === "grammar"
        ? Promise.all([knowledgeService.listGrammarNotes()])
        : Promise.all([
            knowledgeService.listPartTips(),
            knowledgeService.listArticles(),
          ]);

    request
      .then(([content, referenceArticles = []]) => {
        setData(content);
        setArticles(referenceArticles);
      })
      .finally(() => setLoading(false));
  }, [kind]);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <SectionTitle
        eyebrow={
          kind === "grammar" ? "GRAMMAR STUDIO" : "SMART TEST STRATEGIES"
        }
        title={kind === "grammar" ? "Ngữ pháp TOEIC" : "Mẹo thi TOEIC"}
        description={
          kind === "grammar"
            ? "Tóm tắt những điểm ngữ pháp thường gặp trong bài thi."
            : "Chiến thuật tiếp cận từng Part để sử dụng thời gian hiệu quả."
        }
      />

      {kind === "grammar" ? (
        <GrammarContent notes={data} />
      ) : (
        <TipsContent tips={data} articles={articles} />
      )}
    </>
  );
}

/**
 * Hiển thị các ghi chú ngữ pháp và ví dụ nhận diện nhanh.
 */
function GrammarContent({ notes }) {
  if (!notes.length) {
    return (
      <div className="empty-state panel">
        <span>✦</span>
        <h3>Nội dung đang được biên soạn</h3>
        <p>Ghi chú ngữ pháp sẽ được cập nhật từ hệ thống quản trị.</p>
      </div>
    );
  }

  return (
    <div className="knowledge-grid">
      {notes.map((note) => (
        <article className="panel knowledge-card" key={note.id}>
          <div className="eyebrow">GRAMMAR NOTE</div>
          <h2>{note.title}</h2>
          <p>{note.body}</p>

          {note.quick_rule && (
            <div className="quick-rule">
              <b>NHẬN DIỆN NHANH</b>
              <p>{note.quick_rule}</p>
            </div>
          )}

          {note.example && (
            <div className="grammar-example">{note.example}</div>
          )}
        </article>
      ))}
    </div>
  );
}

/**
 * Hiển thị chiến thuật theo 7 Part và tài liệu tham khảo.
 */
function TipsContent({ tips, articles }) {
  return (
    <>
      {tips.length ? (
        <div className="tip-overview-grid">
          {tips.map((tip) => (
            <article className="tip-overview" key={tip.id}>
              <div className="eyebrow">
                PART {tip.part_number} ·{" "}
                {(partNames[tip.part_number - 1] || "").toUpperCase()}
              </div>
              <h2>{tip.title}</h2>
              <p>{tip.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <span>✦</span>
          <h3>Chưa có mẹo thi</h3>
          <p>Nội dung chiến thuật sẽ được cập nhật từ hệ thống quản trị.</p>
        </div>
      )}

      {articles.length > 0 && (
        <section className="knowledge-articles">
          <div className="section-title">
            <div>
              <div className="eyebrow">REFERENCE MATERIAL</div>
              <h2>Bài viết tham khảo</h2>
            </div>
          </div>

          <div className="tip-article-list">
            {articles.map((article) => (
              <a
                className="tip-article"
                href={article.url}
                key={article.id}
                target="_blank"
                rel="noreferrer"
              >
                <span>{article.title}</span>
                <small>{article.source_name || "Mở bài viết"} <ArrowIcon direction="up-right" /></small>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default KnowledgePage;
