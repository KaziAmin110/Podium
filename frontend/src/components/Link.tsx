import React from "react";
interface LinkProps {
  to: string;
  children: React.ReactNode;
}

const Link = ({ to, children }: LinkProps) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.history.pushState({}, "", to);
    const navigationEvent = new PopStateEvent("navigate");
    window.dispatchEvent(navigationEvent);
  };

  return (
    <a href={to} onClick={handleClick} className="nav-link">
      {children}
    </a>
  );
};

export default Link;