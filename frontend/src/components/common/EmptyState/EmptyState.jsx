import React from "react";

/**
 * Trạng thái không có dữ liệu, có thể kèm CTA.
 */
function EmptyState({ icon = "✦", title, description, action }) {
  return (
    <div className="empty-state panel">
      <span>{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
