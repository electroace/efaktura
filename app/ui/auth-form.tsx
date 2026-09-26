"use client";

import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ config, next, initialMode = "signin", googleEnabled, appleEnabled }: { config: { url: string; key: string }; next: string; initialMode?: "signin" | "signup"; googleEnabled: boolean; appleEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName,setFullName]=useState("");
  const [phone,setPhone]=useState("");
  const [companyName,setCompanyName]=useState("");
  const [address,setAddress]=useState("");
  const [city,setCity]=useState("");
  const [jib,setJib]=useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(initialMode);
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
        const registration={full_name:fullName.trim(),contact_phone:phone.trim(),company_name:companyName.trim(),
          company_address:address.trim(),company_city:city.trim(),company_jib:jib.trim()};
        if(Object.values(registration).some(value=>!value))throw new Error("Popunite sva polja za registraciju.");
        const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: callback(),data:registration } });
        if (error) throw error;
        if (data.session) {
          // Registracija i prva firma koriste iste podatke; ako API nije spreman,
          // početna stranica ih može ponovo ponuditi iz podataka naloga.
          await fetch("/api/company",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
            name:registration.company_name,address:registration.company_address,city:registration.company_city,
            jib:registration.company_jib,phone:registration.contact_phone,contactPerson:registration.full_name,
            contactEmail:email,invoiceTitle:"Faktura",offerTitle:"Ponuda",showDiscount:false,electronicNotice:true,
          })}).catch(()=>null);
          window.location.assign(next);
        }
        else setMessage("Zahtjev za registraciju je primljen. Provjerite email i mapu neželjene pošte.");
      } else {
        const { error } = await client().auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(next);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Pokušajte ponovo."); }
    finally { setBusy(false); }
  }

  async function resendConfirmation() {
    setBusy(true); setError(""); setMessage("");
    try {
      const { error } = await client().auth.resend({ type: "signup", email, options: { emailRedirectTo: callback() } });
      if (error) throw error;
      setMessage("Ponovo smo zatražili slanje potvrde. Provjerite email i mapu neželjene pošte.");
    } catch (e) { setError(e instanceof Error ? e.message : "Pokušajte ponovo kasnije."); }
    finally { setBusy(false); }
  }

  async function oauth(provider: "google" | "apple") {
    setBusy(true); setError("");
    const { error } = await client().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) { setError(error.message); setBusy(false); }
  }

  return <>
    {(googleEnabled || appleEnabled) && <><div className="auth-providers">{googleEnabled && <Button disabled={busy} variant="outline" onClick={() => void oauth("google")}>Nastavi putem Google naloga</Button>}{appleEnabled && <Button disabled={busy} variant="outline" onClick={() => void oauth("apple")}>Nastavi putem Apple naloga</Button>}</div><div className="auth-divider">ili putem emaila</div></>}
    <div className="auth-tabs"><button className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")}>Prijava</button><button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Registracija</button></div>
    <form onSubmit={submit} className="auth-fields">
      {mode === "signup" && <>
        <label>Ime i prezime <Input required autoComplete="name" maxLength={120} value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
        <label>Kontakt telefon <Input type="tel" required autoComplete="tel" maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
        <label>Ime firme <Input required autoComplete="organization" maxLength={180} value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label>
        <label>Adresa firme <Input required autoComplete="street-address" maxLength={250} value={address} onChange={e=>setAddress(e.target.value)}/></label>
        <label>Grad <Input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)}/></label>
        <label>ID broj firme <Input required maxLength={32} value={jib} onChange={e=>setJib(e.target.value)}/></label>
      </>}
      <label>Email <Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
      {mode !== "reset" && <label>Lozinka <Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)}/></label>}
      {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Sačekajte..." : mode === "signup" ? "Registruj se besplatno" : mode === "reset" ? "Pošalji uputstvo" : "Prijavi se"}</Button>
    </form>
    {mode === "signup" && email.includes("@") && <button className="text-action auth-reset" disabled={busy} onClick={() => void resendConfirmation()}>Ponovo pošalji potvrdu</button>}
    <button className="text-action auth-reset" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? "Nazad na prijavu" : "Zaboravljena lozinka?"}</button>
  </>;
}
