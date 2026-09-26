import React from "react";

/**
 * Ô tìm kiếm có giá trị controlled.
 */
function SearchInput({ value, onChange, placeholder = "Tìm kiếm…" }) {
  return (
    <label className="search-box">
      <span aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

export default SearchInput;
