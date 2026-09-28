import React, { useCallback, useState } from "react";
import authService from "../../../services/authService";
import { Button } from "../../../shared/ui";
import GoogleLoginButton from "../GoogleLoginButton/GoogleLoginButton";
import OtpForm from "../OtpForm/OtpForm";
import PasswordRequirements from "../../../shared/PasswordRequirements";
import FormWarning from "../../../shared/FormWarning";
import { isPasswordPolicySatisfied, PASSWORD_POLICY_MESSAGE } from "../../../shared/passwordPolicy";
import "./LoginModal.scss";

/**
 * Modal đăng nhập, đăng ký OTP và đăng nhập Google.
 */
function LoginModal({ onClose, onUser }) {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** Xử lý credential do Google Identity Services trả về. */
  const handleGoogleSuccess = useCallback(
    async (credential) => {
      setBusy(true);
      setError("");
      try {
        const result = await authService.googleLogin(credential);
        onUser(result.user);
        onClose();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBusy(false);
      }
    },
    [onClose, onUser],
  );

  /** Hiển thị lỗi rõ ràng nếu frontend chưa nhận được Google Client ID. */
  const handleUnavailableGoogleLogin = () => {
    setError(
      "Google Login chưa được cấu hình cho frontend. Hãy kiểm tra REACT_APP_GOOGLE_CLIENT_ID và khởi động lại frontend.",
    );
  };
  /**
   * Xử lý submit theo trạng thái hiện tại của form.
   */
  const submit = async (event) => {
    event.preventDefault();
    if (mode === "register" && !requested && !isPasswordPolicySatisfied(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        const result = await authService.login(email, password);
        onUser(result.user);
        onClose();
      } else if (!requested) {
        await authService.requestRegisterOtp(
          email,
          password,
          name,
        );
        setRequested(true);
      } else {
        const result = await authService.verifyRegisterOtp(email, otp);
        onUser(result.user);
        onClose();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="eyebrow">TOEICLAB ACCOUNT</div>
        <h2>
          {mode === "login"
            ? "Chào mừng bạn quay lại"
            : "Tạo tài khoản học tập"}
        </h2>
        <p>Lưu tiến độ học từ và lịch sử luyện thi trên các thiết bị.</p>
        <form onSubmit={submit}>
          {mode === "register" && !requested && (
            <label>
              Họ tên
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {!requested && (
            <label>
              Mật khẩu
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={mode === "register" ? 128 : undefined}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
              {mode === "register" && <PasswordRequirements />}
            </label>
          )}
          {requested && (
            <OtpForm value={otp} onChange={setOtp} />
          )}
          <FormWarning message={error} />
          <Button disabled={busy}>
            {busy
              ? "Đang xử lý…"
              : mode === "login"
              ? "Đăng nhập"
                : requested
                  ? "Xác nhận OTP và đăng ký"
                  : "Đăng ký"}
          </Button>
        </form>
        {mode === "login" && (
          <>
            <div className="auth-divider">hoặc tiếp tục với</div>
            {googleClientId ? (
              <GoogleLoginButton
                clientId={googleClientId}
                onSuccess={handleGoogleSuccess}
              />
            ) : (
              <button
                className="google-login-fallback"
                type="button"
                onClick={handleUnavailableGoogleLogin}
              >
                <span aria-hidden="true">G</span>
                Đăng nhập bằng Google
              </button>
            )}
          </>
        )}
        <button
          className="text-button modal-switch"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setRequested(false);
            setError("");
          }}
        >
          {mode === "login"
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </div>
  );
}

export default LoginModal;
