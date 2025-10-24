import React from "react";
import "./App.css";

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
      <span className="slider round"></span>
    </label>
  );
}
