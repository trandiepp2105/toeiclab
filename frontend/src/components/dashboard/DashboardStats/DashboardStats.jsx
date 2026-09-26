import React from "react";

/**
 * Lưới các chỉ số tổng quan của dashboard.
 *
 * @param {Array<{label: string, value: React.ReactNode, caption?: string}>} stats
 */
function DashboardStats({ stats = [] }) {
  return (
    <div className="stat-grid dashboard-stats">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span className="stat-label">{stat.label}</span>
          <b>{stat.value}</b>
          {stat.caption && <small>{stat.caption}</small>}
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
