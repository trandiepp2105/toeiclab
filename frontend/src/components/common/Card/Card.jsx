import React from "react";

/**
 * Container card dùng chung cho nội dung page.
 */
function Card({ children, className = "", as: Element = "section", ...props }) {
  return (
    <Element className={`card ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}

export default Card;
