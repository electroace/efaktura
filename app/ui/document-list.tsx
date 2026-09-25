import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Entry = { id: string; type: string; title: string; number: string; issue_date: string; client_name: string; created_at: string };

export function DocumentList({ documents }: {documents: Entry[]}) {
  return <section className="panel list-panel">
    <div className="panel-heading"><h2>Moji dokumenti</h2><span>{documents.length} prikazano</span></div>
    {!documents.length ? <div className="empty-list"><div className="empty-icon"><FileText size={28}/></div><h3>Još nemate dokumenata</h3><p>Kreirajte prvu fakturu, ponudu ili dokument po svom nazivu.</p><a href="/novi" className="secondary-button">Kreiraj prvi dokument</a></div>
    : <div className="table-wrap"><Table><TableHeader><TableRow><TableHead>Dokument</TableHead><TableHead>Broj</TableHead><TableHead>Kupac</TableHead><TableHead>Datum</TableHead><TableHead className="text-right">Otvori</TableHead></TableRow></TableHeader>
      <TableBody>{documents.map(doc => <TableRow key={doc.id}><TableCell><span className="doc-type-icon"><FileText size={16}/></span><strong>{doc.title}</strong></TableCell><TableCell>{doc.number}</TableCell><TableCell>{doc.client_name}</TableCell><TableCell>{doc.issue_date.split("-").reverse().join(".")}</TableCell><TableCell className="text-right"><a className="table-link" href={`/dokumenti/${doc.id}`}>Detalji →</a></TableCell></TableRow>)}</TableBody>
    </Table></div>}
  </section>;
}
