"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlanRequest } from "@/lib/billing";
import { downloadProforma } from "./proforma-pdf";

export function PlanAccess({ initial, ready, price, activeUntil }: { initial: PlanRequest[]; ready: boolean; price: number; activeUntil: string | null }) {
  const [requests, setRequests] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = requests.find(r => r.status === "pending");
  async function download(request: PlanRequest) {
    try { setError(""); await downloadProforma(request); }
    catch (error) { console.error("Proforma PDF failed", error); setError("PDF nije pripremljen. Pokušajte ponovo."); }
  }
  async function submit() {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/plan-requests", { method: "POST" });
      const data = await response.json() as { request?: PlanRequest; error?: string };
      if (!response.ok || !data.request) throw new Error(data.error ?? "Zahtjev nije poslan.");
      setRequests(prev => [data.request!, ...prev.filter(r => r.id !== data.request!.id)]);
      setNotice(data.request.email_status === "sent" ? "Zahtjev je poslan administratoru. Sačuvajte predračun za uplatu." : "Zahtjev je evidentiran u administraciji. Sačuvajte predračun za uplatu.");
      await download(data.request);
    } catch (error) { setError(error instanceof Error ? error.message : "Pokušajte ponovo."); }
    finally { setBusy(false); }
  }
  return <div className="subscription-layout">
    <section className="panel subscription-card"><p className="eyebrow">JEDAN MJESEC</p><h2>{price.toLocaleString("bs-BA", {minimumFractionDigits:2,maximumFractionDigits:2})} KM <small>s PDV-om</small></h2>
      <p>Predračun izdaje BRATTS d.o.o. Pristup plaćenom paketu počinje kada administrator evidentira uplatu.</p>
      {activeUntil && <p className="form-success">Plaćeni paket aktivan do {new Date(activeUntil).toLocaleDateString("bs-BA")}.</p>}
      {!ready ? <p className="form-error">Predračuni će biti dostupni čim administrator unese podatke za uplatu.</p>
        : pending ? <p>Zahtjev {pending.number} čeka evidentiranje uplate. Predračun možete ponovo preuzeti.</p>
        : <Button disabled={busy} onClick={() => void submit()}>{busy ? "Priprema..." : activeUntil ? "Zatraži produženje i preuzmi predračun" : "Izaberi plaćeni paket i preuzmi predračun"}</Button>}
      {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-success">{notice}</p>}
    </section>
    {!!requests.length && <section className="panel subscription-history"><h2>Predračuni i zahtjevi</h2>{requests.map(item => <div key={item.id} className="subscription-row"><div><strong>{item.number}</strong><span>{new Date(item.created_at).toLocaleDateString("bs-BA")} · {item.status === "pending" ? "Čeka uplatu" : item.status === "activated" ? "Aktivirano" : "Odbijeno"}</span></div><Button variant="outline" onClick={() => void download(item)}>Preuzmi PDF</Button></div>)}</section>}
  </div>;
}
