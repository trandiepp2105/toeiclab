import React from "react";

import QuickAction from "../QuickAction/QuickAction";

/**
 * Nhóm các lối tắt học tập trên dashboard.
 */
function QuickActionGrid({ actions = [] }) {
  return (
    <div className="quick-grid">
      {actions.map((action) => (
        <QuickAction key={action.title} {...action} />
      ))}
    </div>
  );
}

export default QuickActionGrid;
