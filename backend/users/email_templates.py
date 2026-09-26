"""HTML and plain-text email templates used by the users domain."""

from html import escape


def registration_otp_email(otp):
    """Build the subject and multipart body for email registration OTP."""
    safe_otp = escape(str(otp))
    subject = "Xác minh đăng ký tài khoản TOEICLab"
    text_body = (
        "Xác minh đăng ký TOEICLab\n\n"
        f"Mã xác minh của bạn: {otp}\n\n"
        "Mã có hiệu lực trong 10 phút. Nếu bạn không thực hiện đăng ký, "
        "hãy bỏ qua email này."
    )
    html_body = f"""<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
  </head>
  <body style="margin:0;background:#f4f6fa;color:#252a34;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width:608px;margin:0 auto;background:#ffffff;border:1px solid #e1e5ec;border-radius:16px;">
            <tr>
              <td style="padding:36px 36px 30px;text-align:center;">
                <div style="display:inline-block;margin-bottom:25px;color:#182b4b;font-size:24px;font-weight:700;line-height:32px;">
                  <span style="display:inline-block;width:28px;height:28px;margin-right:8px;vertical-align:-5px;border-radius:7px;background:#6d4aff;box-shadow:7px 0 0 #b14cff;"></span>
                  TOEICLab
                </div>
                <h1 style="margin:0 0 18px;color:#252a34;font-size:24px;line-height:32px;">
                  Xác minh đăng ký tài khoản
                </h1>
                <p style="max-width:440px;margin:0 auto;color:#626b79;font-size:15px;line-height:23px;">
                  Chúng tôi nhận được yêu cầu đăng ký tài khoản TOEICLab.
                  Nhập mã dưới đây vào cửa sổ đăng ký để tiếp tục.
                </p>
                <div style="margin:28px 0 20px;padding:26px 16px;border-radius:12px;background:#eef1f3;color:#252a34;font-size:34px;font-weight:700;letter-spacing:8px;line-height:42px;">
                  {safe_otp}
                </div>
                <p style="margin:0;color:#737b87;font-size:14px;line-height:22px;">
                  Mã có hiệu lực trong <strong>10 phút</strong>.
                </p>
                <p style="margin:20px 0 0;color:#8b929d;font-size:13px;line-height:20px;">
                  Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
                  Không chia sẻ mã xác minh với người khác.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px;">
                <div style="height:1px;background:#e6e9ee;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px 30px;text-align:center;color:#9299a4;font-size:12px;line-height:19px;">
                Học hiệu quả hơn cùng TOEICLab.<br>
                © TOEICLab. Email tự động, vui lòng không trả lời.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    return subject, text_body, html_body


def password_reset_otp_email(otp):
    """Build a branded multipart email containing a password-reset OTP."""
    safe_otp = escape(str(otp))
    subject = "Mã xác nhận đổi mật khẩu TOEICLab"
    text_body = (
        "Yêu cầu đổi mật khẩu TOEICLab\n\n"
        f"Mã xác nhận của bạn: {otp}\n\n"
        "Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đổi mật khẩu, "
        "hãy bỏ qua email này."
    )
    html_body = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:#f4f6fa;color:#252a34;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:608px;margin:0 auto;background:#fff;border:1px solid #e1e5ec;border-radius:16px;">
      <tr><td style="padding:36px;text-align:center;">
        <div style="margin-bottom:25px;color:#182b4b;font-size:24px;font-weight:700;">TOEICLab</div>
        <h1 style="margin:0 0 18px;font-size:24px;">Xác nhận đổi mật khẩu</h1>
        <p style="color:#626b79;font-size:15px;line-height:23px;">Nhập mã dưới đây vào trang đổi mật khẩu để xác minh yêu cầu của bạn.</p>
        <div style="margin:28px 0 20px;padding:26px 16px;border-radius:12px;background:#eef1f3;font-size:34px;font-weight:700;letter-spacing:8px;">{safe_otp}</div>
        <p style="color:#737b87;font-size:14px;line-height:22px;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p style="color:#8b929d;font-size:13px;line-height:20px;">Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này. Không chia sẻ mã xác nhận với người khác.</p>
      </td></tr>
      <tr><td style="padding:18px 36px 28px;text-align:center;color:#9299a4;font-size:12px;">Email tự động từ TOEICLab.</td></tr>
    </table>
  </td></tr></table>
</body></html>"""
    return subject, text_body, html_body
