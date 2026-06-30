import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Capture from "./components/Capture";
import Today from "./components/Today";

function useIsPhone() {
  const [phone, setPhone] = useState(typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const on = () => setPhone(window.innerWidth < 720);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return phone;
}

function Home() {
  const isPhone = useIsPhone();
  const loc = useLocation();
  // On a phone, the dashboard cannot honor "one screen, no scroll" — show the Today glance.
  if (isPhone && loc.pathname === "/") return <Navigate to="/today" replace />;
  return <Dashboard />;
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="boot">opening…</div>
    );
  }
  if (!session) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/today" element={<Today />} />
      <Route path="/capture" element={<Capture />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
