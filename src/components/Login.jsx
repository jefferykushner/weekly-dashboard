import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("in"); // "in" | "up"
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg("Account created. If email confirmation is on, check your inbox, then sign in.");
        setMode("in");
      }
    } catch (e) {
      setMsg(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-coil" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => <span key={i} />)}
        </div>
        <h1>Your week, in one view.</h1>
        <p className="auth-sub">Sign {mode === "in" ? "in" : "up"} to open your dashboard.</p>
        <input
          type="email" placeholder="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        />
        <input
          type="password" placeholder="password"
          value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        />
        <button className="auth-go" onClick={go} disabled={busy}>
          {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        {msg && <div className="auth-msg">{msg}</div>}
        <button className="auth-switch" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "First time? Create your account" : "Already set up? Sign in"}
        </button>
      </div>
    </div>
  );
}
