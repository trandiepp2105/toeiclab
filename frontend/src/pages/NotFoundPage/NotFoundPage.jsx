import React from "react";
import { Button } from "../../shared/ui";

/**
 * Trang dự phòng cho URL không tồn tại.
 */
function NotFoundPage({ go }) {
  return (
    <div className="empty-state panel">
      <span>404</span>
      <h2>Không tìm thấy trang</h2>
      <Button onClick={() => go("/")}>Về tổng quan</Button>
    </div>
  );
}

export default NotFoundPage;
