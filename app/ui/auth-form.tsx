"use client";

import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ config, next }: { config: { url: string; key: string }; next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const client = () => createBrowserClient(config.url, config.key);
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset` });
        if (error) throw error;
        setMessage("Ako ovaj email ima nalog, poslat ćemo uputstvo za novu lozinku.");
      } else if (mode === "signup") {
        const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        if (data.session) window.location.assign(next);
        else setMessage("Provjerite email i potvrdite registraciju, pa unesite podatke firme.");
      } else {
        const { error } = await client().auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(next);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Pokušajte ponovo."); }
    finally { setBusy(false); }
  }

  async function oauth(provider: "google" | "apple") {
    setBusy(true); setError("");
    const { error } = await client().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) { setError(error.message); setBusy(false); }
  }

  return <>
    <div className="auth-providers"><Button disabled={busy} variant="outline" onClick={() => void oauth("google")}>Nastavi putem Google naloga</Button><Button disabled={busy} variant="outline" onClick={() => void oauth("apple")}>Nastavi putem Apple naloga</Button></div>
    <div className="auth-divider">ili putem emaila</div>
    <div className="auth-tabs"><button className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")}>Prijava</button><button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Registracija</button></div>
    <form onSubmit={submit} className="auth-fields">
      <label>Email <Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
      {mode !== "reset" && <label>Lozinka <Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)}/></label>}
      {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Sačekajte..." : mode === "signup" ? "Registruj se besplatno" : mode === "reset" ? "Pošalji uputstvo" : "Prijavi se"}</Button>
    </form>
    <button className="text-action auth-reset" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? "Nazad na prijavu" : "Zaboravljena lozinka?"}</button>
  </>;
}
