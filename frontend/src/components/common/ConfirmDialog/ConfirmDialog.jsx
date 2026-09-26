import React from "react";

import Modal from "../Modal/Modal";
import Button from "../Button/Button";

/**
 * Dialog xác nhận một hành động có thể thay đổi dữ liệu.
 */
function ConfirmDialog({
  open,
  title = "Xác nhận thao tác",
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="dialog-actions">
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
