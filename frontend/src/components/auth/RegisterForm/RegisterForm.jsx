import React, { useState } from "react";

/**
 * Form khởi tạo đăng ký tài khoản và gửi OTP.
 */
function RegisterForm({ onSubmit, loading = false, error = "" }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      display_name: displayName,
      email,
      password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Họ tên
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Mật khẩu
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error && <div className="notice notice-error">{error}</div>}
      <button disabled={loading}>
        {loading ? "Đang gửi OTP…" : "Gửi mã OTP"}
      </button>
    </form>
  );
}

export default RegisterForm;
