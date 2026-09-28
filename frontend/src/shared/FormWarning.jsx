import React from "react";
import "./FormWarning.scss";

/** A compact, accessible warning used for form validation errors. */
export default function FormWarning({ message }) {
  if (!message) return null;

  return (
    <div className="form-warning" role="alert" aria-live="polite">
      <span className="form-warning-icon" aria-hidden="true">!</span>
      <span className="form-warning-message">{message}</span>
    </div>
  );
}
