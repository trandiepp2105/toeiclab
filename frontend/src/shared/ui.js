import React from "react";
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

/**
 * Loại bỏ các thẻ và thuộc tính có thể thực thi script trước khi
 * render nội dung HTML lấy từ ngân hàng câu hỏi.
 */
function safeMarkup(value) {
  const template = document.createElement("template");
  template.innerHTML = value || "";
  const executableScheme = ["java", "script:"].join("");
  template.content
    .querySelectorAll("script,iframe,object,embed,style,svg")
    .forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) =>
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const content = attribute.value.trim().toLowerCase();
      if (
        name.startsWith("on") ||
        (["src", "href", "xlink:href"].includes(name) &&
          content.startsWith(executableScheme))
      ) {
        node.removeAttribute(attribute.name);
      }
    }),
  );
  return template.innerHTML;
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
function Loading() {
  return (
    <div className="loading">
      <span className="spinner" />
      Đang tải dữ liệu TOEICLab…
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
