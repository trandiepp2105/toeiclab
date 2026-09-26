import React from "react";

/**
 * Nút tài khoản trên header/sidebar.
 */
function AccountButton({ user, onClick }) {
  const name = user?.display_name || user?.email || "Khách học tập";

  return (
    <button className="profile-button" onClick={onClick}>
      <span className="avatar">{user ? name[0].toUpperCase() : "👤"}</span>
      <span className="profile-copy">
        <b>{name}</b>
        <small>{user ? "Tài khoản TOEICLab" : "Đăng nhập để đồng bộ"}</small>
      </span>
    </button>
  );
}

export default AccountButton;
