import React from "react";

/**
 * Bộ tab controlled.
 *
 * @param {Array<{value: string, label: string}>} items - Danh sách tab.
 */
function Tabs({ items = [], value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          className={value === item.value ? "active" : ""}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
