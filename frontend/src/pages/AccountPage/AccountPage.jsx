import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, SectionTitle } from "../../shared/ui";
import "./AccountPage.scss";

/**
 * Trang quản lý tài khoản và đổi mật khẩu.
 */
function AccountPage({ user, openLogin, logout }) {
  const navigate = useNavigate();
  return (
    <>
      <SectionTitle
        eyebrow="YOUR ACCOUNT"
        title="Tài khoản"
        description="Quản lý hồ sơ và đồng bộ tiến độ học tập."
      />
      {user ? (
        <>
          <div className="panel account-card">
            <span className="avatar avatar-large">
              {(user.display_name || user.email)[0].toUpperCase()}
            </span>
            <div>
              <h2>{user.display_name || "Học viên TOEIC"}</h2>
              <p>{user.email}</p>
              <span className="status-pill">Tài khoản đang hoạt động</span>
            </div>
            <div className="account-card-actions">
              <Button kind="outline" onClick={() => navigate("/account/change-password")}>
                Đổi mật khẩu
              </Button>
              <Button kind="danger" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel account-prompt">
          <span className="avatar avatar-large">👤</span>
          <h2>Đồng bộ hành trình học của bạn</h2>
          <p>
            Đăng nhập để lưu lịch sử làm bài, quiz từ vựng và tiến độ đã ghi
            nhớ.
          </p>
          <Button onClick={openLogin}>Đăng nhập hoặc đăng ký</Button>
        </div>
      )}
    </>
  );
}

export default AccountPage;
