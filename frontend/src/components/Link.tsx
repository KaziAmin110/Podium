import React, { type ReactNode } from "react";

const Link = ({ to, children }: { to: string; children: ReactNode }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("navigate"));
  };
  return (
    <a href={to} onClick={handleClick} className="nav-link">
      {children}
    </a>
  );
};

export default Link;
