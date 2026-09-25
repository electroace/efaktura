"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadProforma } from "./proforma-pdf";
import type { PlanRequest } from "@/lib/billing";

type RequestRow = PlanRequest & { customer_name: string; customer_email: string };

export function AdminRequests() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try { const response = await fetch("/api/admin/requests"); const data = await response.json() as {requests:RequestRow[];error?:string}; if (!response.ok) throw new Error(data.error); setItems(data.requests); }
    catch (error) { setError(error instanceof Error ? error.message : "Zahtjevi nisu dostupni."); }
  }
  useEffect(() => { void load(); }, []);
  async function update(id: string, action: "activate" | "decline" | "resend") {
    setBusy(id); setError("");
    try { const response = await fetch("/api/admin/requests", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) }); const data = await response.json() as {error?:string;ok?:boolean;emailStatus?:string}; if (!response.ok) throw new Error(data.error); await load(); if (action === "resend" && data.emailStatus !== "sent") setError("Email nije poslan. Provjerite Resend ključ i potvrđenu adresu pošiljaoca; zahtjev ostaje u administraciji."); }
    catch (error) { setError(error instanceof Error ? error.message : "Zahtjev nije ažuriran."); }
    finally { setBusy(""); }
  }
  return <section className="panel admin-requests"><h2>Zahtjevi za plaćeni paket {items.filter(i => i.status === "pending").length > 0 && <span className="request-count">{items.filter(i => i.status === "pending").length} novo</span>}</h2>
    <p>Aktivirajte paket na jedan mjesec kada evidentirate uplatu. Zahtjevi ostaju ovdje i ako email obavijest još nije podešena.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!items.length && <p>Još nema zahtjeva.</p>}
    {items.map(item => <article key={item.id} className="request-row"><div><strong>{item.customer_name}</strong><span>{item.customer_email} · {item.number}</span><span>{(item.amount_cents/100).toLocaleString("bs-BA", {minimumFractionDigits:2,maximumFractionDigits:2})} KM s PDV-om · {new Date(item.created_at).toLocaleDateString("bs-BA")}</span><span>{item.status === "pending" ? "Čeka uplatu" : item.status === "activated" ? "Aktivirano" : "Odbijeno"}{item.email_status !== "sent" ? " · Email obavijest nije poslana" : " · Email obavijest poslana"}</span></div>
      <div className="request-actions"><Button variant="outline" onClick={() => void downloadProforma(item).catch(() => setError("PDF nije pripremljen."))}>Predračun</Button>{item.status === "pending" && <>{item.email_status !== "sent" && <Button variant="outline" disabled={busy === item.id} onClick={() => void update(item.id,"resend")}>Pošalji email</Button>}<Button disabled={busy === item.id} onClick={() => void update(item.id,"activate")}>Aktiviraj nakon uplate</Button><Button variant="outline" disabled={busy === item.id} onClick={() => void update(item.id,"decline")}>Odbij</Button></>}</div>
    </article>)}
  </section>;
}
