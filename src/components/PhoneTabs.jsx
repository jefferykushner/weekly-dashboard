import React from "react";
import { Link } from "react-router-dom";

export default function PhoneTabs({ active }) {
  return (
    <nav className="phone-tabs">
      <Link className={active === "capture" ? "on" : ""} to="/capture">Capture</Link>
      <Link className={active === "myday" ? "on" : ""} to="/myday">My Day</Link>
      <Link className={active === "words" ? "on" : ""} to="/words">Words</Link>
    </nav>
  );
}
