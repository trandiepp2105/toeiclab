import React from "react";

/**
 * Select controlled dùng cho các bộ lọc và cấu hình bài học.
 */
function Select({ value, onChange, options = [], label, ...props }) {
  return (
    <label className="field-select-label">
      {label && <span className="field-label">{label}</span>}
      <select value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Select;
