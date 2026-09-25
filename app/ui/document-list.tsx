import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Entry = { id: string; type: string; title: string; number: string; issue_date: string; client_name: string; created_at: string };

export function DocumentList({ documents, query, type, page, total }: {documents: Entry[];query:string;type:string;page:number;total:number}) {
  const link = (target:number) => `/?${new URLSearchParams({...(query?{q:query}:{}),...(type?{type}:{}),page:String(target)})}`;
  return <section className="panel list-panel">
    <div className="panel-heading"><h2>Moji dokumenti</h2><span>{total} ukupno</span></div>
    <form action="/" method="get" className="document-search"><label>Pretraga <input type="search" name="q" defaultValue={query} placeholder="Broj, naziv, kupac ili BF" maxLength={100}/></label><label>Vrsta <select name="type" defaultValue={type}><option value="">Sve vrste</option><option value="invoice">Fakture</option><option value="offer">Ponude</option><option value="custom">Drugi dokumenti</option></select></label><button type="submit" className="secondary-button">Pretraži</button>{(query||type)&&<a href="/" className="muted-link">Očisti filtere</a>}</form>
    {!documents.length ? <div className="empty-list"><div className="empty-icon"><FileText size={28}/></div><h3>{query||type?"Nema dokumenata za ovu pretragu":"Još nemate dokumenata"}</h3><p>{query||type?"Pokušajte s drugim pojmom ili očistite filtere.":"Kreirajte prvu fakturu, ponudu ili dokument po svom nazivu."}</p>{!(query||type)&&<a href="/novi" className="secondary-button">Kreiraj prvi dokument</a>}</div>
    : <div className="table-wrap"><Table><TableHeader><TableRow><TableHead>Dokument</TableHead><TableHead>Broj</TableHead><TableHead>Kupac</TableHead><TableHead>Datum</TableHead><TableHead className="text-right">Otvori</TableHead></TableRow></TableHeader>
      <TableBody>{documents.map(doc => <TableRow key={doc.id}><TableCell><span className="doc-type-icon"><FileText size={16}/></span><strong>{doc.title}</strong></TableCell><TableCell>{doc.number}</TableCell><TableCell>{doc.client_name}</TableCell><TableCell>{doc.issue_date.split("-").reverse().join(".")}</TableCell><TableCell className="text-right"><a className="table-link" href={`/dokumenti/${doc.id}`}>Detalji →</a></TableCell></TableRow>)}</TableBody>
    </Table></div>}
    {total>50&&<nav className="document-pages" aria-label="Stranice dokumenata">{page>1&&<a href={link(page-1)} className="secondary-button">← Prethodna</a>}<span>Stranica {page} od {Math.ceil(total/50)}</span>{page*50<total&&<a href={link(page+1)} className="secondary-button">Sljedeća →</a>}</nav>}
  </section>;
}
