import React from "react";

/**
 * Header chuẩn cho page, gồm eyebrow, title, mô tả và action.
 */
function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header section-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

export default PageHeader;
