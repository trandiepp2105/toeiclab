import React from "react";
import { Link } from "react-router-dom";

/**
 * Header đơn giản cho các layout cần brand riêng.
 */
function Header({ user, onLogin, onAccount }) {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <img className="brand-logo" src="/logo.png" alt="TOEICLab" />
        <span>
          <b>
            <span className="brand-word-toeic">TOEIC</span>
            <span className="brand-word-lab">Lab</span>
          </b>
          <small>Learn with purpose</small>
        </span>
      </Link>

      {user ? (
        <button className="top-avatar" onClick={onAccount}>
          {(user.display_name || user.email)[0].toUpperCase()}
        </button>
      ) : (
        <button className="button button-outline" onClick={onLogin}>
          Đăng nhập
        </button>
      )}
    </header>
  );
}

export default Header;
