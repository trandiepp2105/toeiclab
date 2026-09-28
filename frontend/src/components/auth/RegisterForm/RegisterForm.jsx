import React, { useState } from "react";
import PasswordRequirements from "../../../shared/PasswordRequirements";
import FormWarning from "../../../shared/FormWarning";
import { isPasswordPolicySatisfied, PASSWORD_POLICY_MESSAGE } from "../../../shared/passwordPolicy";

/**
 * Form khởi tạo đăng ký tài khoản và gửi OTP.
 */
function RegisterForm({ onSubmit, loading = false, error = "" }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isPasswordPolicySatisfied(password)) {
      setPasswordError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    setPasswordError("");
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
          maxLength={128}
          value={password}
          autoComplete="new-password"
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError("");
          }}
          required
        />
      </label>
      <PasswordRequirements />
      <FormWarning message={passwordError || error} />
      <button disabled={loading}>
        {loading ? "Đang gửi OTP…" : "Gửi mã OTP"}
      </button>
    </form>
  );
}

export default RegisterForm;
