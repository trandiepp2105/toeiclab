import React from "react";
import DOMPurify from "dompurify";
import AudioButton from "../components/common/AudioButton/AudioButton";

const navItems = [
  ["/", "statistic.svg", "Thống kê"],
  ["/vocabulary", "vocab.svg", "Từ vựng"],
  ["/tests", "full-test.svg", "Bài thi đầy đủ"],
  ["/parts", "practice.svg", "Luyện tập từng phần"],
  ["/history", "history.svg", "Lịch sử"],
  ["/grammar", "grammar.svg", "Ngữ pháp"],
  ["/tips", "tips.svg", "Mẹo TOEIC"],
];
const partNames = [
  "Mô tả hình ảnh",
  "Hỏi – đáp",
  "Đoạn hội thoại",
  "Bài nói ngắn",
  "Hoàn thành câu",
  "Hoàn thành đoạn văn",
  "Đọc hiểu",
];
/**
 * Format số theo quy ước hiển thị của Việt Nam.
 */
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);

/** Sanitize stored question HTML with the small subset of markup the UI needs. */
function safeMarkup(value) {
  return DOMPurify.sanitize(value || "", {
    ALLOWED_TAGS: [
      "a", "abbr", "b", "blockquote", "br", "caption", "center", "code",
      "dd", "del", "div", "dl", "dt", "em", "h1", "h2", "h3", "h4",
      "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "q", "s",
      "small", "span", "strong", "sub", "sup", "table", "tbody", "td",
      "tfoot", "th", "thead", "tr", "u", "ul",
    ],
    ALLOWED_ATTR: [
      "alt", "align", "class", "colspan", "dir", "height", "href", "lang",
      "rowspan", "scope", "src", "title", "valign", "width",
    ],
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Button dùng chung theo design system của ứng dụng.
 */
function Button({ children, kind = "primary", ...props }) {
  return (
    <button className={`button button-${kind}`} {...props}>
      {children}
    </button>
  );
}

/** SVG dùng thống nhất cho các nút điều hướng và liên kết trong giao diện. */
function ArrowIcon({ direction = "right", className = "" }) {
  return (
    <img
      className={`arrow-icon arrow-icon-${direction} ${className}`.trim()}
      src="/icons/arrow.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

/**
 * Trạng thái loading toàn trang hoặc trong một page.
 */
function Loading({ label = "Đang tải dữ liệu TOEICLab…" }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {label}
    </div>
  );
}

/**
 * Hiển thị lỗi dạng inline khi request thất bại.
 */
function Notice({ error }) {
  return error ? <div className="notice notice-error">{error}</div> : null;
}

/**
 * Header chuẩn cho các page trong khu vực học tập.
 */
function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export {
  navItems,
  partNames,
  fmt,
  safeMarkup,
  AudioButton,
  Button,
  ArrowIcon,
  Loading,
  Notice,
  SectionTitle,
};
