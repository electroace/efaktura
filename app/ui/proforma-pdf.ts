import type { TDocumentDefinitions } from "pdfmake/interfaces";

export type Proforma = {
  number: string; amount_cents: number; base_cents: number; vat_cents: number;
  issuer_json: string; customer_json: string; created_at: string;
};

type Party = { name: string; address: string; city: string; postal_code?: string; postalCode?: string; jib: string; vat_id?: string; vatId?: string; iban?: string; bank?: string; email?: string };

const amount = (cents: number) => `${new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} KM`;
const date = (iso: string) => new Intl.DateTimeFormat("bs-BA", { timeZone: "Europe/Sarajevo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export function proformaDefinition(request: Proforma): TDocumentDefinitions {
  const issuer = JSON.parse(request.issuer_json) as Party;
  const customer = JSON.parse(request.customer_json) as Party;
  const issue = new Date(request.created_at);
  const due = new Date(issue);
  due.setUTCDate(due.getUTCDate() + 7);
  return {
    pageSize: "A4", pageMargins: [42, 48, 42, 48],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#1c3040" },
    content: [
      { columns: [
        { width: "*", stack: [{ text: issuer.name, bold: true, fontSize: 16 }, `${issuer.address}\n${issuer.postal_code ?? ""} ${issuer.city}\nJIB: ${issuer.jib}\nPDV broj: ${issuer.vat_id ?? ""}\n${issuer.email ?? ""}`] },
        { width: "auto", stack: [{ text: "PREDRAČUN", bold: true, fontSize: 20, color: "#0b6878", alignment: "right" }, { text: request.number, alignment: "right", margin: [0, 5, 0, 0] }] },
      ], columnGap: 20 },
      { text: " ", margin: [0, 10] },
      { columns: [
        { width: "*", stack: [{ text: "KUPAC", bold: true, color: "#52717e" }, { text: customer.name, bold: true, margin: [0, 5, 0, 0] }, `${customer.address}\n${customer.postalCode ?? ""} ${customer.city}\nJIB: ${customer.jib}${customer.vatId ? `\nPDV broj: ${customer.vatId}` : ""}`] },
        { width: "auto", stack: [{ text: `Datum izdavanja: ${date(request.created_at)}` }, { text: `Rok plaćanja: ${date(due.toISOString())}`, margin: [0, 5, 0, 0] }] },
      ], columnGap: 20, margin: [0, 5, 0, 26] },
      { table: { headerRows: 1, widths: ["*", "auto", "auto"], body: [
        [{ text: "USLUGA", bold: true }, { text: "KOLIČINA", bold: true, alignment: "right" }, { text: "IZNOS BEZ PDV-A", bold: true, alignment: "right" }],
        ["eFaktura — plaćeni paket, jedan mjesec od aktivacije", { text: "1", alignment: "right" }, { text: amount(request.base_cents), alignment: "right" }],
      ] }, layout: "lightHorizontalLines" },
      { table: { widths: ["*", "auto"], body: [
        [{ text: "Osnovica", alignment: "right" }, { text: amount(request.base_cents), alignment: "right" }],
        [{ text: "PDV 17%", alignment: "right" }, { text: amount(request.vat_cents), alignment: "right" }],
        [{ text: "UKUPNO ZA UPLATU", bold: true, alignment: "right", fontSize: 12 }, { text: amount(request.amount_cents), bold: true, alignment: "right", fontSize: 12 }],
      ] }, layout: "noBorders", margin: [0, 20, 0, 24] },
      { text: "PODACI ZA UPLATU", bold: true, color: "#0b6878" },
      { text: `Primalac: ${issuer.name}\nBanka: ${issuer.bank ?? ""}\nRačun / IBAN: ${issuer.iban ?? ""}\nSvrha: eFaktura pretplata, poziv na broj ${request.number}`, margin: [0, 8, 0, 18] },
      { text: "Ovo je predračun i nije dokaz o uplati niti fiskalni račun. Plaćeni paket aktivira se nakon što administrator evidentira uplatu.", color: "#52717e", fontSize: 9 },
    ],
  };
}

export async function downloadProforma(request: Proforma) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(fonts);
  pdfMake.createPdf(proformaDefinition(request)).download(`Predracun-${request.number}.pdf`);
}
