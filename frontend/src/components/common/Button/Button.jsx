import React from "react";

/**
 * Button dùng chung, hỗ trợ các biến thể visual và trạng thái loading.
 */
function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`button button-${variant}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Đang xử lý…" : children}
    </button>
  );
}

export default Button;
