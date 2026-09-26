import React from "react";

/**
 * Badge trạng thái nhỏ dùng trong card/list.
 */
function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default Badge;
