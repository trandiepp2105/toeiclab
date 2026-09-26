import React from "react";

/**
 * Card hiển thị một hoạt động học gần đây.
 */
function RecentActivityCard({ activity, onClick }) {
  if (!activity) return null;

  return (
    <article className="panel recent-card">
      <div>
        <div className="eyebrow">HOẠT ĐỘNG GẦN ĐÂY</div>
        <h3>{activity.title}</h3>
        <p>{activity.description}</p>
      </div>
      {onClick && (
        <button className="button button-outline" onClick={onClick}>
          Xem chi tiết
        </button>
      )}
    </article>
  );
}

export default RecentActivityCard;
