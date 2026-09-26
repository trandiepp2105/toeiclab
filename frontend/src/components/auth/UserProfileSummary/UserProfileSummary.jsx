import React from "react";

/**
 * Tóm tắt tài khoản ở sidebar hoặc account page.
 */
function UserProfileSummary({ user, onClick }) {
  if (!user) {
    return (
      <button className="profile-button" onClick={onClick}>
        <span className="avatar">👤</span>
        <span className="profile-copy">
          <b>Khách học tập</b>
          <small>Đăng nhập để đồng bộ</small>
        </span>
      </button>
    );
  }

  const name = user.display_name || user.email;

  return (
    <button className="profile-button" onClick={onClick}>
      <span className="avatar">{name[0].toUpperCase()}</span>
      <span className="profile-copy">
        <b>{name}</b>
        <small>Tài khoản TOEICLab</small>
      </span>
    </button>
  );
}

export default UserProfileSummary;
