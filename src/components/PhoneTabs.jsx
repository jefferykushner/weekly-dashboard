import React from "react";
import { Link } from "react-router-dom";

export default function PhoneTabs({ active }) {
  return (
    <nav className="phone-tabs">
      <Link className={active === "today" ? "on" : ""} to="/today">Today</Link>
      <Link className={active === "capture" ? "on" : ""} to="/capture">Capture</Link>
    </nav>
  );
}
