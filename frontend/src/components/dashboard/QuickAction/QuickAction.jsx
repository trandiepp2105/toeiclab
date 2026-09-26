import React from "react";
import { ArrowIcon } from "../../../shared/ui";

/**
 * Lối tắt trên dashboard cho một hoạt động học tập.
 */
function QuickAction({ icon, tone, title, text, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <span className={`quick-icon tone-${tone}`}>{icon}</span>
      <b>{title}</b>
      <small>{text}</small>
      <span className="quick-arrow"><ArrowIcon direction="up-right" /></span>
    </button>
  );
}

export default QuickAction;
