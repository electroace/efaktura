"use client";

import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordReset({ config }: { config: { url: string; key: string } }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const client = createBrowserClient(config.url, config.key);
    const { error } = await client.auth.updateUser({ password });
    setMessage(error ? error.message : "Lozinka je promijenjena. Možete otvoriti svoje dokumente.");
  }
  return <form className="auth-fields" onSubmit={submit}><label>Nova lozinka <Input type="password" minLength={6} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><Button type="submit">Sačuvaj lozinku</Button>{message && <p role="status">{message}</p>}</form>;
}
