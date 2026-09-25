"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Printer, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Company, Customer, CatalogItem } from "@/lib/server";

type Item = {name:string;description?:string;sku?:string;quantity:number;unit:string;price:number;vat:number};
type Issuer = {name:string;address:string;city:string;postalCode:string;jib:string;vatId:string;vatRegistered:boolean;iban:string;bank:string;phone:string;email:string;contactPerson?:string;logoKey:string|null};
type Doc = {id?:string;type:string;title:string;number:string;issueDate:string;dueDate:string;clientName:string;clientAddress:string;clientId:string;clientContact:string;showClientContact:boolean;showIssuerContact:boolean;fiscalNumber:string;currency:string;items:Item[];notes:string;issuer?:Issuer};
const today = () => new Date().toLocaleDateString("en-CA", {timeZone:"Europe/Sarajevo"});
const money = (n:number,currency:string) => new Intl.NumberFormat("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n) + " " + currency;
const date = (v:string) => v ? v.split("-").reverse().join(".") : "—";

export function Editor({isFree,used,vatRegistered,company,customers,catalogItems,initial}:{isFree:boolean;used:number;vatRegistered:boolean;company:Company;customers:Customer[];catalogItems:CatalogItem[];initial?:Doc}) {
  const [doc,setDoc] = useState<Doc>(initial ?? {type:"invoice",title:"Faktura",number:"",issueDate:today(),dueDate:"",clientName:"",clientAddress:"",clientId:"",clientContact:"",showClientContact:false,showIssuerContact:false,fiscalNumber:"",currency:"KM",items:[{name:"",quantity:1,unit:"kom",price:0,vat:vatRegistered?17:0}],notes:""});
  const [busy,setBusy] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const issuer:Issuer = doc.issuer ? {...doc.issuer,contactPerson:doc.issuer.contactPerson ?? company.contact_person} : {name:company.name,address:company.address,city:company.city,postalCode:company.postal_code,jib:company.jib,vatId:company.vat_id,vatRegistered:!!company.vat_registered,iban:company.iban,bank:company.bank,phone:company.phone,email:company.contact_email,contactPerson:company.contact_person,logoKey:company.logo_key};
  const set = (key:keyof Doc,value:unknown) => {setDoc(prev=>({...prev,[key]:value}));setDirty(true);setNotice("");};
  const setItem = (index:number,key:keyof Item,value:string|number) => {
    setDoc(prev=>({...prev,items:prev.items.map((item,i)=>i===index?{...item,[key]:value}:item)}));
    setDirty(true);setNotice("");
  };
  const pickCustomer = (id:string) => {
    const customer=customers.find(c=>c.id===id);
    if(!customer) return;
    setDoc(prev=>({...prev,clientName:customer.name,clientAddress:[customer.address,[customer.postal_code,customer.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),clientId:customer.jib,clientContact:customer.contact_person}));
    setDirty(true);setNotice("");
  };
  const pickItem = (index:number,id:string) => {
    const item=catalogItems.find(c=>c.id===id);
    if(!item) return;
    setDoc(prev=>({...prev,items:prev.items.map((row,i)=>i===index?{...row,name:item.name,description:item.description,sku:item.sku,unit:item.unit,price:item.price,vat:issuer.vatRegistered?item.vat:0}:row)}));
    setDirty(true);setNotice("");
  };
  const subtotal = doc.items.reduce((s,i)=>s+Math.round((Number(i.quantity)||0)*(Number(i.price)||0)*100),0)/100;
  const vat = doc.items.reduce((s,i)=>s+Math.round(Math.round((Number(i.quantity)||0)*(Number(i.price)||0)*100)*(Number(i.vat)||0)/100),0)/100;
  const save = async (event:React.FormEvent) => {
    event.preventDefault(); setBusy(true);setError("");setNotice("");
    try {
      const response = await fetch(initial?.id ? `/api/documents/${initial.id}` : "/api/documents",{
        method:initial?.id?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(doc)
      });
      const data = await response.json() as {id:string;number:string;error?:string};
      if(!response.ok) throw new Error(data.error ?? "Dokument nije sačuvan.");
      setDoc(prev=>({...prev,id:data.id,number:data.number}));
      setDirty(false);setNotice("Dokument je sačuvan.");
      if (!initial?.id) window.location.assign(`/dokumenti/${data.id}`);
    } catch(e) {setError(e instanceof Error?e.message:"Pokušajte ponovo.");}
    finally {setBusy(false);}
  };
  const canExport = !!doc.id && !dirty;
  const exportWord = async () => {
    try { const {downloadWord}=await import("./word-export"); await downloadWord(doc,issuer); }
    catch(error) { console.error("Word export failed",error);setError("Word dokument nije pripremljen. Pokušajte ponovo."); }
  };
  useEffect(() => {
    const context = (document as Document & {modelContext?: {registerTool?: (tool:unknown, options:{signal:AbortSignal})=>Promise<void>|void}}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({
      name:"set_document_client", title:"Unesi kupca",
      description:"Unesi naziv kupca u trenutno otvoreni nacrt dokumenta. Ova radnja ne čuva dokument.",
      inputSchema:{type:"object",properties:{name:{type:"string",minLength:1,maxLength:180}},required:["name"],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input:unknown) {
        const name=(input as {name?:unknown})?.name;
        if(typeof name!=="string"||!name.trim()||name.length>180) throw new Error("Unesite naziv kupca.");
        setDoc(prev=>({...prev,clientName:name.trim()}));setDirty(true);
        return {clientName:name.trim(),saved:false};
      }
    },{signal:lifecycle.signal})).catch(()=>{}); } catch {}
    return ()=>lifecycle.abort();
  },[]);
  return <main className="editor-layout">
    <form className="editor-panel" onSubmit={save}>
      <div className="editor-top"><div><p className="eyebrow">{initial?.id ? "UREDI DOKUMENT" : "NOVI DOKUMENT"}</p><h1>{initial?.id ? doc.title : "Kreirajte dokument"}</h1></div><a href="/" className="muted-link">Zatvori</a></div>
      {isFree && <p className="limit-note">{initial?.id ? "Besplatni paket: do 5 stavki po fakturi." : `Besplatni paket: ${used}/3 fakture ovog mjeseca, do 5 stavki po fakturi. Ponude i drugi dokumenti nemaju mjesečno ograničenje.`}</p>}
      <div className="section-heading"><span>01</span><h2>Osnovni podaci</h2></div>
      <div className="form-grid">
        <label>Vrsta dokumenta <Select value={doc.type} disabled={!!initial?.id} onValueChange={v=>{setDoc(prev=>({...prev,type:v,title:v==="invoice"?"Faktura":v==="offer"?"Ponuda":prev.type==="custom"?prev.title:""}));setDirty(true);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="invoice">Faktura</SelectItem><SelectItem value="offer">Ponuda</SelectItem><SelectItem value="custom">Drugi dokument</SelectItem></SelectContent></Select></label>
        {doc.type==="custom" && <label>Naziv dokumenta <Input required value={doc.title} onChange={e=>set("title",e.target.value)} placeholder="Predračun, otpremnica..."/></label>}
        <label>Broj dokumenta <Input value={doc.number} onChange={e=>set("number",e.target.value)} placeholder="Automatski po spremanju"/></label>
        <label>BF — broj fiskalnog računa <Input value={doc.fiscalNumber} onChange={e=>set("fiscalNumber",e.target.value)} placeholder="Opcionalno"/></label>
        <label>Datum izdavanja <Input type="date" required value={doc.issueDate} onChange={e=>set("issueDate",e.target.value)}/></label>
        <label>{doc.type==="offer"?"Ponuda važi do":"Rok plaćanja"} <Input type="date" value={doc.dueDate} onChange={e=>set("dueDate",e.target.value)}/></label>
        <label>Valuta <Select value={doc.currency} onValueChange={v=>set("currency",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="KM">KM</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select></label>
      </div>
      <div className="section-heading"><span>02</span><h2>Kupac</h2></div>
      <div className="form-grid"><div className="full directory-picker"><label>Izaberite sačuvanog kupca <select className="native-select" defaultValue="" onChange={e=>pickCustomer(e.target.value)}><option value="">Ručno unesite ili izaberite kupca...</option>{customers.map(c=><option value={c.id} key={c.id}>{c.name}{c.jib?` · ${c.jib}`:""}</option>)}</select></label><a href="/kupci">Uredi imenik kupaca →</a></div>
        <label className="full">Naziv kupca <Input required value={doc.clientName} onChange={e=>set("clientName",e.target.value)} placeholder="Naziv firme ili ime i prezime"/></label>
        <label className="full">Adresa kupca <Input value={doc.clientAddress} onChange={e=>set("clientAddress",e.target.value)} placeholder="Ulica, grad, poštanski broj"/></label>
        <label>JIB / ID kupca <Input value={doc.clientId} onChange={e=>set("clientId",e.target.value)}/></label>
        <label>Kontakt osoba kupca <Input value={doc.clientContact} onChange={e=>set("clientContact",e.target.value)} placeholder="Ime i prezime (opcionalno)"/></label>
      </div>
      <div className="section-heading"><span>03</span><h2>Stavke</h2></div>
      <p className="directory-hint">Pozovite sačuvanu robu ili uslugu, a zatim po potrebi promijenite količinu ili cijenu samo na ovom dokumentu. <a href="/stavke">Uredi imenik stavki →</a></p>
      <div className="item-stack">{doc.items.map((item,index)=><div className="item-card" key={index}>
        <div className="item-card-title"><strong>Stavka {index+1}</strong><Button type="button" variant="ghost" size="icon" aria-label={`Ukloni stavku ${index+1}`} disabled={doc.items.length===1} onClick={()=>set("items",doc.items.filter((_,i)=>i!==index))}><Trash2 size={16}/></Button></div>
        <label>Izaberi iz imenika <select className="native-select" defaultValue="" onChange={e=>pickItem(index,e.target.value)}><option value="">Ručno unesite ili izaberite stavku...</option>{catalogItems.map(c=><option value={c.id} key={c.id}>{c.kind==="goods"?"Roba":"Usluga"}: {c.name} · {c.price.toLocaleString("bs-BA",{minimumFractionDigits:2})} KM</option>)}</select></label>
        <label>Naziv artikla ili usluge <Input required value={item.name} onChange={e=>setItem(index,"name",e.target.value)} placeholder="Opis stavke"/></label>
        <div className="item-fields item-details"><label>Šifra / SKU <Input value={item.sku??""} onChange={e=>setItem(index,"sku",e.target.value)}/></label><label>Opis stavke <Input value={item.description??""} onChange={e=>setItem(index,"description",e.target.value)}/></label></div>
        <div className="item-fields"><label>Količina <Input type="number" min="0.001" step="any" required value={item.quantity} onChange={e=>setItem(index,"quantity",Number(e.target.value))}/></label>
          <label>Jedinica <Input value={item.unit} onChange={e=>setItem(index,"unit",e.target.value)}/></label>
          <label>Cijena <Input type="number" min="0" step="0.01" required value={item.price} onChange={e=>setItem(index,"price",Number(e.target.value))}/></label>
          <label>PDV % <Input type="number" min="0" max="100" step="0.01" disabled={!issuer.vatRegistered} value={issuer.vatRegistered?item.vat:0} onChange={e=>setItem(index,"vat",Number(e.target.value))}/></label></div>
      </div>)}</div>
      <Button type="button" variant="outline" disabled={doc.items.length >= (isFree && doc.type === "invoice"?5:100)} onClick={()=>set("items",[...doc.items,{name:"",quantity:1,unit:"kom",price:0,vat:issuer.vatRegistered?17:0}])}><Plus size={16}/> Dodaj stavku</Button>
      <div className="section-heading"><span>04</span><h2>Napomena i ispis</h2></div>
      <textarea className="notes-input" rows={3} value={doc.notes} onChange={e=>set("notes",e.target.value)} placeholder="Uslovi plaćanja ili dodatne informacije (opcionalno)"/>
      <div className="print-options"><strong>Prikaži kontakt osobe na PDF-u i Word dokumentu</strong>
        <label><input type="checkbox" checked={doc.showIssuerContact} onChange={e=>set("showIssuerContact",e.target.checked)}/> Kontakt osoba moje firme {issuer.contactPerson?`(${issuer.contactPerson})`:"(unesite je u Podaci firme)"}</label>
        <label><input type="checkbox" checked={doc.showClientContact} onChange={e=>set("showClientContact",e.target.checked)}/> Kontakt osoba kupca {doc.clientContact?`(${doc.clientContact})`:"(unesite je iznad)"}</label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
      <div className="editor-actions"><Button type="submit" disabled={busy || (!initial?.id && isFree && doc.type === "invoice" && used>=3)} className="submit-button"><Save size={17}/>{busy?"Čuvanje...":"Sačuvaj dokument"}</Button>
        {canExport && <><Button type="button" variant="outline" onClick={()=>window.print()}><Printer size={17}/> PDF / štampa</Button><Button type="button" variant="outline" onClick={exportWord}><Download size={17}/> Word (.docx)</Button></>}</div>
    </form>
    <aside className="preview-column"><div className="preview-label"><span>PREGLED DOKUMENTA</span><span>A4</span></div><article className="document-paper" id="document-paper">
      <div className="paper-header"><div>{issuer.logoKey && <img className="paper-logo" src={doc.id ? `/api/logo?document=${encodeURIComponent(doc.id)}` : "/api/logo"} alt="Logo firme"/>}<h2>{issuer.name}</h2><p>{issuer.address}<br/>{issuer.postalCode} {issuer.city}<br/>JIB: {issuer.jib}{issuer.vatId && <> · PDV: {issuer.vatId}</>}<br/>{issuer.phone}{issuer.phone&&issuer.email?" · ":""}{issuer.email}{doc.showIssuerContact&&issuer.contactPerson&&<><br/>Kontakt osoba: {issuer.contactPerson}</>}</p></div><div className="paper-title"><span>{doc.title || "Dokument"}</span><strong>{doc.number || "Broj po spremanju"}</strong></div></div>
      <div className="paper-parties"><div><span>IZDANO ZA</span><strong>{doc.clientName || "Naziv kupca"}</strong><p>{doc.clientAddress}{doc.clientAddress&&doc.clientId?<br/>:null}{doc.clientId&&`JIB: ${doc.clientId}`}{doc.showClientContact&&doc.clientContact&&<><br/>Kontakt osoba: {doc.clientContact}</>}</p></div><div><span>DETALJI</span><p>Datum izdavanja: <strong>{date(doc.issueDate)}</strong></p>{doc.dueDate&&<p>{doc.type==="offer"?"Važi do":"Rok plaćanja"}: <strong>{date(doc.dueDate)}</strong></p>}{doc.fiscalNumber&&<p>BF: <strong>{doc.fiscalNumber}</strong></p>}</div></div>
      <table className="paper-table"><thead><tr><th>Opis</th><th>Kol.</th><th>Cijena</th>{issuer.vatRegistered&&<th>PDV</th>}<th>Iznos</th></tr></thead><tbody>{doc.items.map((i,n)=><tr key={n}><td>{i.name||"Nova stavka"}{i.sku&&<small>Šifra: {i.sku}</small>}{i.description&&<small>{i.description}</small>}<small>{i.unit}</small></td><td>{i.quantity}</td><td>{money(i.price,doc.currency)}</td>{issuer.vatRegistered&&<td>{i.vat}%</td>}<td>{money(Math.round((Number(i.quantity)||0)*(Number(i.price)||0)*100)/100,doc.currency)}</td></tr>)}</tbody></table>
      <div className="invoice-total"><div><span>Osnovica</span><strong>{money(subtotal,doc.currency)}</strong></div>{issuer.vatRegistered&&<div><span>PDV</span><strong>{money(vat,doc.currency)}</strong></div>}<div className="grand-total"><span>Ukupno za plaćanje</span><strong>{money(subtotal+vat,doc.currency)}</strong></div></div>
      {(issuer.iban||issuer.bank)&&<p className="payment-info"><strong>Podaci za uplatu</strong><br/>{issuer.bank}{issuer.bank&&issuer.iban?" · ":""}{issuer.iban}</p>}
      {doc.notes&&<p className="paper-foot"><strong>Napomena</strong><br/>{doc.notes}</p>}
    </article><p className="preview-hint">Za PDF odaberite „PDF / štampa“, pa u prozoru preglednika „Sačuvaj kao PDF“.</p></aside>
  </main>;
}
