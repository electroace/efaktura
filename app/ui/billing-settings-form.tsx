"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BillingSettings } from "@/lib/billing";

const empty: BillingSettings = { name: "BRATTS d.o.o.", address: "", city: "", postal_code: "", jib: "", vat_id: "", iban: "", bank: "", email: "electroace@gmail.com" };

export function BillingSettingsForm() {
  const [form, setForm] = useState(empty);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    try { const response = await fetch("/api/admin/billing"); const data = await response.json() as {settings:BillingSettings;ready:boolean;error?:string}; if (!response.ok) throw new Error(data.error); setForm(data.settings); setReady(data.ready); }
    catch (error) { setError(error instanceof Error ? error.message : "Podaci nisu dostupni."); }
  })(); }, []);
  const set = (key: keyof BillingSettings, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/billing", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json() as {error?:string};
      if (!response.ok) throw new Error(data.error);
      setReady(true); setMessage("Podaci izdavaoca su sačuvani. Predračuni su dostupni korisnicima.");
    } catch (error) { setError(error instanceof Error ? error.message : "Podaci nisu sačuvani."); }
    finally { setBusy(false); }
  }
  return <section className="panel billing-admin"><h2>Podaci za predračun</h2><p>{ready ? "Predračuni su dostupni korisnicima." : "Popunite podatke BRATTS-a da korisnici mogu odmah preuzeti predračun."}</p>
    <form onSubmit={save} className="form-grid">
      <label className="full">Naziv izdavaoca <Input required value={form.name} onChange={e => set("name", e.target.value)}/></label>
      <label className="full">Adresa <Input required value={form.address} onChange={e => set("address", e.target.value)}/></label>
      <label>Grad <Input required value={form.city} onChange={e => set("city", e.target.value)}/></label>
      <label>Poštanski broj <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)}/></label>
      <label>JIB <Input required value={form.jib} onChange={e => set("jib", e.target.value)}/></label>
      <label>PDV broj <Input required value={form.vat_id} onChange={e => set("vat_id", e.target.value)}/></label>
      <label>Račun / IBAN <Input required value={form.iban} onChange={e => set("iban", e.target.value)}/></label>
      <label>Banka <Input required value={form.bank} onChange={e => set("bank", e.target.value)}/></label>
      <label className="full">Kontakt email na predračunu <Input type="email" required value={form.email} onChange={e => set("email", e.target.value)}/></label>
      <div className="full">{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}<Button disabled={busy} type="submit">{busy ? "Čuvanje..." : "Sačuvaj podatke"}</Button></div>
    </form>
  </section>;
}
