"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type CompanyForm = {
  name: string; address: string; city: string; postalCode: string; jib: string; vatId: string;
  vatRegistered: boolean; iban: string; bank: string; phone: string; contactEmail: string;
};

export function Onboarding({ email, initial, settings = false }: {email: string; initial?: CompanyForm; settings?: boolean}) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyForm>(initial ?? { name:"", address:"", city:"", postalCode:"", jib:"", vatId:"", vatRegistered:false, iban:"", bank:"", phone:"", contactEmail:email });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const set = (key: keyof CompanyForm, value: string | boolean) => setForm(prev => ({...prev, [key]:value}));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/company", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(form) });
      const data = await response.json() as {error?:string};
      if (!response.ok) throw new Error(data.error ?? "Podaci nisu sačuvani.");
      setSuccess("Podaci su sačuvani.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Pokušajte ponovo."); }
    finally {setBusy(false);}
  };
  return <section className="setup-layout">
    <div className="setup-intro"><p className="eyebrow">{settings ? "POSTAVKE" : "PRVI KORAK"}</p><h1>{settings ? "Podaci firme" : "Predstavite svoju firmu."}</h1><p>{settings ? "Ovi podaci se koriste na novim dokumentima. Već kreirani dokumenti čuvaju podatke iz trenutka kreiranja." : "Unesite osnovne podatke i odmah počnite koristiti besplatni paket."}</p><div className="setup-tip"><strong>Šta pripremiti?</strong><span>Naziv, adresu, JIB i, ako ga imate, PDV broj i podatke za uplatu.</span></div></div>
    <div className="panel company-form"><form onSubmit={submit}>
      <h2>Podaci o firmi</h2>
      <div className="form-grid">
        <label className="full">Naziv firme <Input required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Naziv d.o.o." /></label>
        <label className="full">Adresa <Input required value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Ulica i broj" /></label>
        <label>Grad <Input required value={form.city} onChange={e=>set("city",e.target.value)} /></label>
        <label>Poštanski broj <Input value={form.postalCode} onChange={e=>set("postalCode",e.target.value)} /></label>
        <label>JIB / ID broj <Input required value={form.jib} onChange={e=>set("jib",e.target.value)} /></label>
        <label>PDV broj <Input value={form.vatId} onChange={e=>set("vatId",e.target.value)} /></label>
        <label className="checkbox-row full"><Checkbox checked={form.vatRegistered} onCheckedChange={value=>set("vatRegistered",value === true)}/> Firma je u sistemu PDV-a</label>
        <label>Transakcijski račun / IBAN <Input value={form.iban} onChange={e=>set("iban",e.target.value)} /></label>
        <label>Banka <Input value={form.bank} onChange={e=>set("bank",e.target.value)} /></label>
        <label>Telefon <Input value={form.phone} onChange={e=>set("phone",e.target.value)} /></label>
        <label>Email na dokumentu <Input type="email" value={form.contactEmail} onChange={e=>set("contactEmail",e.target.value)} /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}
      <Button className="submit-button" disabled={busy} type="submit">{busy ? "Čuvanje..." : settings ? "Sačuvaj izmjene" : "Otvori besplatni nalog"}</Button>
    </form>{settings && <LogoUpload />}</div>
  </section>;
}

function LogoUpload() {
  const [status, setStatus] = useState("");
  return <div className="logo-upload"><h3>Logo firme</h3><p>PNG, JPG ili WebP do 1 MB. Prikazuje se na novim dokumentima.</p>
    <form onSubmit={async e => {
      e.preventDefault();
      const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
      if (!input?.files?.[0]) return;
      setStatus("Slanje...");
      const body = new FormData(); body.append("logo", input.files[0]);
      try {
        const result = await fetch("/api/logo", {method:"POST", body});
        const data = await result.json() as {error?:string};
        setStatus(result.ok ? "Logo je sačuvan." : data.error ?? "Logo nije sačuvan.");
      } catch { setStatus("Logo nije sačuvan."); }
    }}><Input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Logo firme"/><Button type="submit" variant="outline">Pošalji logo</Button></form>
    {status && <span role="status">{status}</span>}
  </div>;
}
