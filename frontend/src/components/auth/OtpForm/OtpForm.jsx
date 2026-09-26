import React, { useEffect, useRef, useState } from "react";
import "./OtpForm.scss";

/**
 * Form nhập OTP xác thực email.
 */
function OtpForm({ value = "", onChange }) {
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(() => value.padEnd(6, " ").slice(0, 6).split(""));

  useEffect(() => {
    setDigits(value.padEnd(6, " ").slice(0, 6).split(""));
  }, [value]);

  /** Cập nhật đúng một vị trí OTP và chuyển focus sang ô tiếp theo. */
  const handleChange = (index, event) => {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    onChange(nextDigits.join("").replace(/\s/g, ""));

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /** Hỗ trợ dán cả 6 chữ số vào ô đang được focus. */
  const handlePaste = (event) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextDigits = pastedDigits.padEnd(6, " ").split("");
    setDigits(nextDigits);
    onChange(pastedDigits);
    inputRefs.current[Math.min(pastedDigits.length, 5)]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="otp-form" aria-label="Nhập mã OTP 6 số">
      <span className="otp-label">Mã xác nhận OTP</span>
      <div className="otp-inputs">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => { inputRefs.current[index] = element; }}
            aria-label={`Số OTP thứ ${index + 1}`}
            inputMode="numeric"
            maxLength={1}
            pattern="[0-9]"
            value={digit.trim()}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            required
          />
        ))}
      </div>
    </div>
  );
}

export default OtpForm;
