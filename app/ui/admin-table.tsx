"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Company = { user_id: string; email:string; name:string; jib:string; city:string; plan:string; price_bam:number; created_at:string };
export function AdminTable() {
  const [companies,setCompanies] = useState<Company[]>([]);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState("");
  const [loading,setLoading] = useState(true);
  const load = async () => {
    try { const r = await fetch("/api/admin"); const d = await r.json() as {error?:string;companies:Company[]}; if (!r.ok) throw new Error(d.error); setCompanies(d.companies); }
    catch(e) { setError(e instanceof Error ? e.message : "Podaci nisu dostupni."); }
    finally {setLoading(false);}
  };
  useEffect(()=>{ void load(); },[]);
  const change = (id:string, key:keyof Company, value:string|number) => setCompanies(prev => prev.map(c => c.user_id === id ? {...c,[key]:value} : c));
  const save = async (c:Company) => {
    setBusy(c.user_id); setError("");
    try { const r = await fetch("/api/admin",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({userId:c.user_id,plan:c.plan,priceBam:Number(c.price_bam)})}); const d=await r.json() as {error?:string}; if(!r.ok) throw new Error(d.error); await load(); }
    catch(e){setError(e instanceof Error ? e.message : "Izmjene nisu sačuvane.");}
    finally{setBusy("");}
  };
  return <section className="panel admin-panel">{error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <p>Učitavanje prijava...</p> : !companies.length ? <p>Još nema prijava firmi.</p> : <div className="admin-list">{companies.map(c=><article className="admin-row" key={c.user_id}>
      <div className="admin-identity"><strong>{c.name}</strong><span>{c.city} · JIB {c.jib}</span><span>{c.email} · {new Date(c.created_at).toLocaleDateString("bs-BA")}</span></div>
      <label>Paket <Select value={c.plan} onValueChange={v=>change(c.user_id,"plan",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="free">Besplatni</SelectItem><SelectItem value="paid">Plaćeni</SelectItem></SelectContent></Select></label>
      <label>Cijena KM / mj. s PDV-om <Input type="number" min="0" max="100000" value={c.price_bam} onChange={e=>change(c.user_id,"price_bam",Number(e.target.value))}/></label>
      <Button onClick={()=>save(c)} disabled={busy===c.user_id}>{busy===c.user_id ? "Čuvanje..." : "Sačuvaj"}</Button>
    </article>)}</div>}</section>;
}
