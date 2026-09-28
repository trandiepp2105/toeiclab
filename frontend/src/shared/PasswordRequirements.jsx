import React from "react";
import "./PasswordRequirements.scss";

/** Renders live password policy hints without exposing the password value. */
export default function PasswordRequirements() {
  return (
    <p className="password-policy-note" aria-live="polite">
      Tối thiểu 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt.
    </p>
  );
}
