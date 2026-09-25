"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer, CatalogItem } from "@/lib/server";
import type { CustomerInput, CatalogInput } from "@/lib/catalog";

const emptyCustomer: CustomerInput = {name:"",address:"",city:"",postal_code:"",jib:"",vat_id:"",email:"",phone:"",contact_person:"",contact_email:"",contact_phone:"",notes:""};
const emptyItem: CatalogInput = {kind:"service",name:"",description:"",sku:"",unit:"kom",price:0,vat:17};

export function CustomerDirectory({ initial }: { initial: Customer[] }) {
  const [rows,setRows] = useState(initial);
  const [selected,setSelected] = useState<string|null>(null);
  const [form,setForm] = useState<CustomerInput>(emptyCustomer);
  const [filter,setFilter] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const set = (key:keyof CustomerInput,value:string) => setForm(current=>({...current,[key]:value}));
  const edit = (c:Customer) => {
    setSelected(c.id);
    setForm({name:c.name,address:c.address,city:c.city,postal_code:c.postal_code,jib:c.jib,vat_id:c.vat_id,email:c.email,phone:c.phone,contact_person:c.contact_person,contact_email:c.contact_email,contact_phone:c.contact_phone,notes:c.notes});
    setError("");setMessage("");
  };
  async function save(event:FormEvent) {
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch(selected?`/api/kupci/${selected}`:"/api/kupci",{method:selected?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      const data=await response.json() as {customer?:Customer;error?:string};
      if(!response.ok||!data.customer) throw new Error(data.error||"Kupac nije sačuvan.");
      const saved=data.customer;
      setRows(current=>[...current.filter(c=>c.id!==saved.id),saved].sort((a,b)=>a.name.localeCompare(b.name,"bs")));
      setSelected(saved.id);setMessage("Kupac je sačuvan i dostupan pri izradi dokumenta.");
    } catch(e) {setError(e instanceof Error?e.message:"Pokušajte ponovo.");}
    finally {setBusy(false);}
  }
  const visible=rows.filter(c=>[c.name,c.jib,c.contact_person,c.city].some(v=>v.toLocaleLowerCase("bs").includes(filter.toLocaleLowerCase("bs"))));
  return <div className="directory-layout">
    <section className="panel directory-list"><div className="directory-title"><h2>Sačuvani kupci <small>({rows.length})</small></h2><Button variant="outline" onClick={()=>{setSelected(null);setForm(emptyCustomer);setError("");setMessage("");}}>+ Novi kupac</Button></div>
      <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pretraži po nazivu, JIB-u ili kontaktu" aria-label="Pretraži kupce"/>
      {!visible.length?<p className="directory-empty">{rows.length?"Nema kupaca za ovu pretragu.":"Dodajte prvog kupca. Njegove podatke ćete moći pozvati pri izradi dokumenta."}</p>:<div className="directory-rows">{visible.map(c=><button type="button" key={c.id} className={selected===c.id?"directory-row selected":"directory-row"} onClick={()=>edit(c)}><strong>{c.name}</strong><span>{[c.city,c.jib&&`JIB ${c.jib}`,c.contact_person&&`Kontakt: ${c.contact_person}`].filter(Boolean).join(" · ")||"Podaci kupca"}</span></button>)}</div>}
    </section>
    <form className="panel directory-form" onSubmit={save}><p className="eyebrow">{selected?"UREDI KUPCA":"NOVI KUPAC"}</p><h2>{selected?"Podaci kupca":"Dodajte kupca"}</h2>
      <div className="form-grid">
        <label className="full">Naziv firme ili ime i prezime <Input required value={form.name} onChange={e=>set("name",e.target.value)}/></label>
        <label className="full">Adresa <Input value={form.address} onChange={e=>set("address",e.target.value)}/></label>
        <label>Grad <Input value={form.city} onChange={e=>set("city",e.target.value)}/></label>
        <label>Poštanski broj <Input value={form.postal_code} onChange={e=>set("postal_code",e.target.value)}/></label>
        <label>JIB / ID broj <Input value={form.jib} onChange={e=>set("jib",e.target.value)}/></label>
        <label>PDV broj <Input value={form.vat_id} onChange={e=>set("vat_id",e.target.value)}/></label>
        <label>Email kupca <Input type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></label>
        <label>Telefon kupca <Input value={form.phone} onChange={e=>set("phone",e.target.value)}/></label>
        <label className="full">Kontakt osoba <Input value={form.contact_person} onChange={e=>set("contact_person",e.target.value)} placeholder="Ime i prezime"/></label>
        <label>Email kontakt osobe <Input type="email" value={form.contact_email} onChange={e=>set("contact_email",e.target.value)}/></label>
        <label>Telefon kontakt osobe <Input value={form.contact_phone} onChange={e=>set("contact_phone",e.target.value)}/></label>
        <label className="full">Interna napomena <textarea className="notes-input" rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Samo za vaš imenik; ne prikazuje se na dokumentu"/></label>
      </div>
      {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
      <Button className="submit-button" type="submit" disabled={busy}>{busy?"Čuvanje...":"Sačuvaj kupca"}</Button>
    </form>
  </div>;
}

export function ItemDirectory({ initial, vatRegistered }: { initial:CatalogItem[]; vatRegistered:boolean }) {
  const [rows,setRows] = useState(initial);
  const [selected,setSelected] = useState<string|null>(null);
  const [form,setForm] = useState<CatalogInput>({...emptyItem,vat:vatRegistered?17:0});
  const [filter,setFilter] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const set = (key:keyof CatalogInput,value:string|number) => setForm(current=>({...current,[key]:value}));
  const edit=(c:CatalogItem)=>{setSelected(c.id);setForm({kind:c.kind,name:c.name,description:c.description,sku:c.sku,unit:c.unit,price:c.price,vat:c.vat});setError("");setMessage("");};
  async function save(event:FormEvent) {
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch(selected?`/api/stavke/${selected}`:"/api/stavke",{method:selected?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      const data=await response.json() as {item?:CatalogItem;error?:string};
      if(!response.ok||!data.item) throw new Error(data.error||"Stavka nije sačuvana.");
      const saved=data.item;
      setRows(current=>[...current.filter(c=>c.id!==saved.id),saved].sort((a,b)=>a.name.localeCompare(b.name,"bs")));
      setSelected(saved.id);setMessage("Stavka je sačuvana i dostupna pri izradi dokumenta.");
    } catch(e) {setError(e instanceof Error?e.message:"Pokušajte ponovo.");}
    finally {setBusy(false);}
  }
  const visible=rows.filter(c=>[c.name,c.sku,c.description].some(v=>v.toLocaleLowerCase("bs").includes(filter.toLocaleLowerCase("bs"))));
  return <div className="directory-layout">
    <section className="panel directory-list"><div className="directory-title"><h2>Sačuvane stavke <small>({rows.length})</small></h2><Button variant="outline" onClick={()=>{setSelected(null);setForm({...emptyItem,vat:vatRegistered?17:0});setError("");setMessage("");}}>+ Nova stavka</Button></div>
      <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pretraži naziv ili šifru" aria-label="Pretraži stavke"/>
      {!visible.length?<p className="directory-empty">{rows.length?"Nema stavki za ovu pretragu.":"Dodajte robu ili uslugu. Pri izradi dokumenta moći ćete je pozvati iz imenika."}</p>:<div className="directory-rows">{visible.map(c=><button type="button" key={c.id} className={selected===c.id?"directory-row selected":"directory-row"} onClick={()=>edit(c)}><strong>{c.name}</strong><span>{c.kind==="goods"?"Roba":"Usluga"} · {c.price.toLocaleString("bs-BA",{minimumFractionDigits:2})} KM / {c.unit}{c.sku?` · ${c.sku}`:""}</span></button>)}</div>}
    </section>
    <form className="panel directory-form" onSubmit={save}><p className="eyebrow">{selected?"UREDI STAVKU":"NOVA STAVKA"}</p><h2>{selected?"Podaci stavke":"Dodajte robu ili uslugu"}</h2>
      <div className="form-grid">
        <label>Vrsta <select className="native-select" value={form.kind} onChange={e=>set("kind",e.target.value)}><option value="service">Usluga</option><option value="goods">Roba</option></select></label>
        <label>Šifra / SKU <Input value={form.sku} onChange={e=>set("sku",e.target.value)}/></label>
        <label className="full">Naziv <Input required value={form.name} onChange={e=>set("name",e.target.value)}/></label>
        <label className="full">Opis <Input value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Opcionalni detalji koji idu na dokument"/></label>
        <label>Jedinica mjere <Input required value={form.unit} onChange={e=>set("unit",e.target.value)} placeholder="kom, sat, m²..."/></label>
        <label>Cijena po jedinici (KM, bez PDV-a) <Input type="number" min="0" step="0.01" required value={form.price} onChange={e=>set("price",Number(e.target.value))}/></label>
        <label>PDV % <Input type="number" min="0" max="100" step="0.01" disabled={!vatRegistered} value={vatRegistered?form.vat:0} onChange={e=>set("vat",Number(e.target.value))}/></label>
      </div>
      {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
      <Button className="submit-button" type="submit" disabled={busy}>{busy?"Čuvanje...":"Sačuvaj stavku"}</Button>
    </form>
  </div>;
}
