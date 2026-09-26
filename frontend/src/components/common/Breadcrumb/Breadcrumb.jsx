import React from "react";
import { Link } from "react-router-dom";

/**
 * Breadcrumb điều hướng theo danh sách item.
 *
 * @param {Array<{label: string, to?: string}>} items - Các cấp điều hướng.
 */
function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;
