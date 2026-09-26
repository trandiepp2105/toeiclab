import React from "react";

/**
 * Thẻ hiển thị một chỉ số tổng quan.
 */
function Stat({ label, value, icon, tone }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon tone-${tone}`}>{icon}</span>
      <span className="stat-label">{label}</span>
      <b>{value}</b>
      <small>trong thư viện TOEICLab</small>
    </div>
  );
}

export default Stat;
