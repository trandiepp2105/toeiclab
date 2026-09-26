import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";
import { Button, Notice, SectionTitle } from "../../shared/ui";
import "./ChangePasswordPage.scss";

const OTP_LENGTH = 6;

/**
 * Page đổi mật khẩu qua email OTP, gồm ba bước: gửi mã, xác minh mã, đặt mật khẩu.
 * @param {Object} props Thông tin page.
 * @param {Object} props.user Tài khoản đang đăng nhập, dùng để điền sẵn email.
 * @returns {JSX.Element} Quy trình đổi mật khẩu theo trạng thái hiện tại.
 */
function ChangePasswordPage({ user }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitEmail(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const response = await authService.requestPasswordResetOtp(email.trim());
      setEmail(email.trim());
      setNotice(response.message);
      setStep("otp");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitOtp(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const response = await authService.verifyPasswordResetOtp(email, otp);
      setResetToken(response.reset_token);
      setStep("password");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.completePasswordReset(
        resetToken,
        newPassword,
      );
      setNotice(response.message);
      setNewPassword("");
      setConfirmPassword("");
      setStep("complete");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateOtp(event) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digitsOnly);
  }

  return (
    <section className="change-password-page">
      <SectionTitle
        eyebrow="ACCOUNT SECURITY"
        title="Đổi mật khẩu"
        description="Xác minh email trước khi đặt mật khẩu mới cho tài khoản."
      />

      <div className="panel password-reset-card">
        <div className="password-reset-progress" aria-label="Tiến trình đổi mật khẩu">
          <span className={step !== "email" ? "is-complete" : "is-current"}>1. Email</span>
          <span className={step === "otp" || step === "password" || step === "complete" ? "is-complete" : ""}>2. Xác nhận OTP</span>
          <span className={step === "password" || step === "complete" ? "is-complete" : ""}>3. Mật khẩu mới</span>
        </div>

        {step === "email" && (
          <form onSubmit={submitEmail}>
            <h2>Nhận mã xác nhận</h2>
            <p>Mã OTP sẽ được gửi tới email gắn với tài khoản của bạn.</p>
            <label htmlFor="password-reset-email">Email</label>
            <input
              id="password-reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Notice error={error} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi…" : "Gửi yêu cầu đổi mật khẩu"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={submitOtp}>
            <h2>Nhập mã OTP</h2>
            <p>Mã gồm 6 chữ số đã được gửi tới {email}.</p>
            <label htmlFor="password-reset-otp">Mã xác nhận</label>
            <input
              id="password-reset-otp"
              className="password-reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={updateOtp}
              aria-label="Mã OTP gồm 6 chữ số"
              required
            />
            <Notice error={error} />
            {notice && <p className="password-reset-notice">{notice}</p>}
            <Button type="submit" disabled={isSubmitting || otp.length !== OTP_LENGTH}>
              {isSubmitting ? "Đang xác nhận…" : "Xác nhận OTP"}
            </Button>
            <button className="password-reset-link" type="button" onClick={() => setStep("email")}>
              Sửa email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitNewPassword}>
            <h2>Tạo mật khẩu mới</h2>
            <p>Chọn mật khẩu có ít nhất 8 ký tự.</p>
            <label htmlFor="new-password">Mật khẩu mới</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <label htmlFor="confirm-new-password">Nhập lại mật khẩu mới</label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <Notice error={error} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang cập nhật…" : "Hoàn tất đổi mật khẩu"}
            </Button>
          </form>
        )}

        {step === "complete" && (
          <div className="password-reset-complete" role="status">
            <h2>Đổi mật khẩu thành công</h2>
            <p>{notice}</p>
            <Link className="button" to="/account">Quay lại tài khoản</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default ChangePasswordPage;
