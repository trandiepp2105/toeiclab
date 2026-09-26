import React, { useEffect } from "react";
import "./Modal.scss";

/**
 * Modal cơ bản có đóng bằng nút, click backdrop hoặc phím Escape.
 */
function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export default Modal;
