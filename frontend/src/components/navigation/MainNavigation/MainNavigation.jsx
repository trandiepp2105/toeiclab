import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Navigation chính của không gian học tập.
 */
function MainNavigation({ items = [], onNavigate }) {
  return (
    <nav className="main-navigation" aria-label="Điều hướng chính">
      {items.map(([href, iconFile, label]) => (
        <NavLink
          key={href}
          to={href}
          end={href === "/"}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onNavigate}
        >
          <img
            className="nav-icon"
            src={`/icons/${iconFile}`}
            alt=""
            aria-hidden="true"
          />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default MainNavigation;
