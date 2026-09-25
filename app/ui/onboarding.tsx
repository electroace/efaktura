"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type CompanyForm = {
  name: string; address: string; city: string; postalCode: string; jib: string; vatId: string;
  vatRegistered: boolean; iban: string; bank: string; phone: string; contactEmail: string; contactPerson: string;
  defaultNote: string; responsiblePerson: string; electronicNotice: boolean; showSignatureLine: boolean;
};

export function Onboarding({ email, initial, settings = false, hasLogo = false }: {email: string; initial?: CompanyForm; settings?: boolean; hasLogo?: boolean}) {
  const [form, setForm] = useState<CompanyForm>(initial ?? { name:"", address:"", city:"", postalCode:"", jib:"", vatId:"", vatRegistered:false, iban:"", bank:"", phone:"", contactEmail:email, contactPerson:"", defaultNote:"", responsiblePerson:"", electronicNotice:true, showSignatureLine:false });
  const [saved, setSaved] = useState(!!initial);
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
      setSaved(true);
      setSuccess("Podaci su sačuvani. Sada možete dodati logo i napraviti dokument.");
    } catch (e) { setError(e instanceof Error ? e.message : "Pokušajte ponovo."); }
    finally {setBusy(false);}
  };
  return <section className="setup-layout">
    <div className="setup-intro"><p className="eyebrow">{settings ? "POSTAVKE" : "PRVI KORAK"}</p><h1>{settings ? "Postavke" : "Predstavite svoju firmu."}</h1><p>{settings ? "Podesite podatke firme, logo i izgled novih dokumenata. Sačuvani dokumenti zadržavaju svoje postojeće podatke." : "Unesite osnovne podatke i odmah počnite koristiti besplatni paket."}</p><div className="setup-tip"><strong>Šta pripremiti?</strong><span>Naziv, adresu, JIB i, ako ga imate, PDV broj i podatke za uplatu.</span></div></div>
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
        <label className="full">Kontakt osoba firme <Input value={form.contactPerson} onChange={e=>set("contactPerson",e.target.value)} placeholder="Ime i prezime (opcionalno)" /></label>
      </div>
      <div className="settings-document"><h2>Izgled novih dokumenata</h2>
        <label>Zadana napomena <textarea className="notes-input" rows={3} maxLength={1600} value={form.defaultNote} onChange={e=>set("defaultNote",e.target.value)} placeholder="Npr. uslovi isporuke ili plaćanja"/><small>Predlaže se u svakom novom dokumentu; možete je promijeniti na pojedinačnoj fakturi.</small></label>
        <label>Odgovorno lice <Input value={form.responsiblePerson} onChange={e=>set("responsiblePerson",e.target.value)} placeholder="Ime i prezime odgovornog lica"/></label>
        <label className="settings-check"><Checkbox checked={form.electronicNotice} onCheckedChange={checked=>setForm(prev=>({...prev,electronicNotice:checked===true,showSignatureLine:checked===true?false:prev.showSignatureLine}))}/><span>Na dnu prikaži: „Dokument je elektronski izdat i važi bez pečata i potpisa.“</span></label>
        <label className="settings-check"><Checkbox checked={form.showSignatureLine} onCheckedChange={checked=>setForm(prev=>({...prev,showSignatureLine:checked===true,electronicNotice:checked===true?false:prev.electronicNotice}))}/><span>Prikaži liniju za pečat i potpis iznad odgovornog lica</span></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}
      <Button className="submit-button" disabled={busy} type="submit">{busy ? "Čuvanje..." : settings ? "Sačuvaj izmjene" : "Sačuvaj i nastavi"}</Button>
    </form>
    {saved ? <><LogoUpload initialHasLogo={hasLogo}/><div className="onboarding-next"><a href="/novi" className="primary-button">Kreiraj prvi dokument →</a><a href="/" className="secondary-button">Pregled dokumenata</a></div></>
      : <p className="logo-upload-hint">Nakon što sačuvate firmu, ovdje ćete moći dodati njen logo.</p>}
    </div>
  </section>;
}

function LogoUpload({ initialHasLogo }: { initialHasLogo: boolean }) {
  const [status, setStatus] = useState("");
  const [hasLogo, setHasLogo] = useState(initialHasLogo);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  return <div className="logo-upload"><h3>Logo firme</h3><p>PNG, JPG ili WebP do 1 MB. Prikazuje se na novim dokumentima.</p>
    {hasLogo && <div className="logo-upload-preview"><img src={`/api/logo?v=${version}`} alt="Trenutni logo firme"/><span>Vaš logo je sačuvan. Možete ga zamijeniti novom slikom.</span></div>}
    <form onSubmit={async e => {
      e.preventDefault();
      const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
      if (!input?.files?.[0]) { setStatus("Prvo izaberite sliku."); return; }
      if (input.files[0].size > 1024 * 1024) { setStatus("Logo može imati najviše 1 MB."); return; }
      setBusy(true); setStatus("Slanje...");
      const body = new FormData(); body.append("logo", input.files[0]);
      try {
        const result = await fetch("/api/logo", {method:"POST", body});
        const data = await result.json() as {error?:string};
        if (!result.ok) throw new Error(data.error ?? "Logo nije sačuvan.");
        setHasLogo(true); setVersion(Date.now()); setStatus("Logo je sačuvan i prikazivat će se na novim dokumentima.");
        input.value = "";
      } catch (error) { setStatus(error instanceof Error ? error.message : "Logo nije sačuvan."); }
      finally { setBusy(false); }
    }}><Input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Logo firme"/><Button type="submit" disabled={busy} variant="outline">{busy ? "Slanje..." : hasLogo ? "Zamijeni logo" : "Pošalji logo"}</Button></form>
    {status && <span role="status">{status}</span>}
  </div>;
}
