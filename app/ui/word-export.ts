import { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, Packer, ImageRun, WidthType } from "docx";

type Item = {name:string;description?:string;sku?:string;quantity:number;unit:string;price:number;vat:number};
type Issuer = {name:string;address:string;city:string;postalCode:string;jib:string;vatId:string;vatRegistered:boolean;iban:string;bank:string;phone:string;email:string;contactPerson?:string;logoKey:string|null};
type DocData = {id?:string;type:string;title:string;number:string;issueDate:string;dueDate:string;clientName:string;clientAddress:string;clientId:string;clientContact:string;showClientContact:boolean;showIssuerContact:boolean;fiscalNumber:string;currency:string;items:Item[];notes:string};
const money = (n:number,currency:string) => new Intl.NumberFormat("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" "+currency;
const cell=(value:string,bold=false)=>new TableCell({children:[new Paragraph({children:[new TextRun({text:value,bold})]})]});

export async function downloadWord(doc:DocData,issuer:Issuer) {
  const children:(Paragraph|Table)[]=[];
  if(issuer.logoKey) {
    try {
      const image=await fetch(doc.id?`/api/logo?document=${encodeURIComponent(doc.id)}`:"/api/logo");
      if(image.ok) {
        const type=image.headers.get("content-type")?.split(";")[0];
        if(type==="image/png"||type==="image/jpeg"||type==="image/webp") {
          let bytes=new Uint8Array(await image.arrayBuffer());
          let format:"png"|"jpg"=type==="image/jpeg"?"jpg":"png";
          if(type==="image/webp") {
            const bitmap=await createImageBitmap(new Blob([bytes],{type}));
            const canvas=document.createElement("canvas");
            canvas.width=bitmap.width;canvas.height=bitmap.height;
            canvas.getContext("2d")?.drawImage(bitmap,0,0);
            const converted=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
            if(converted) bytes=new Uint8Array(await converted.arrayBuffer());
            bitmap.close();
          }
          children.push(new Paragraph({children:[new ImageRun({data:bytes,type:format,transformation:{width:120,height:60}})]}));
        }
      }
    } catch { /* The document remains usable without a logo. */ }
  }
  children.push(new Paragraph({text:issuer.name,heading:HeadingLevel.HEADING_2}));
  children.push(new Paragraph({text:`${issuer.address}, ${issuer.postalCode} ${issuer.city}`}));
  children.push(new Paragraph({text:`JIB: ${issuer.jib}${issuer.vatId?` · PDV: ${issuer.vatId}`:""}`}));
  children.push(new Paragraph({text:`${issuer.phone}  ${issuer.email}`,spacing:{after:450}}));
  if(doc.showIssuerContact&&issuer.contactPerson) children.push(new Paragraph({text:`Kontakt osoba: ${issuer.contactPerson}`}));
  children.push(new Paragraph({text:doc.title,heading:HeadingLevel.HEADING_1,alignment:AlignmentType.RIGHT}));
  children.push(new Paragraph({text:doc.number,alignment:AlignmentType.RIGHT,spacing:{after:350}}));
  children.push(new Paragraph({children:[new TextRun({text:"Kupac: ",bold:true}),new TextRun(doc.clientName)]}));
  if(doc.clientAddress)children.push(new Paragraph({text:doc.clientAddress}));
  if(doc.clientId)children.push(new Paragraph({text:`JIB kupca: ${doc.clientId}`}));
  if(doc.showClientContact&&doc.clientContact)children.push(new Paragraph({text:`Kontakt osoba kupca: ${doc.clientContact}`}));
  children.push(new Paragraph({text:`Datum izdavanja: ${doc.issueDate.split("-").reverse().join(".")}`}));
  if(doc.fiscalNumber)children.push(new Paragraph({text:`BF: ${doc.fiscalNumber}`}));
  if(doc.dueDate)children.push(new Paragraph({text:`${doc.type==="offer"?"Ponuda važi do":"Rok plaćanja"}: ${doc.dueDate.split("-").reverse().join(".")}`,spacing:{after:350}}));
  else children.push(new Paragraph({text:"",spacing:{after:250}}));
  const headers=["Opis","Kol.","Cijena",...(issuer.vatRegistered?["PDV"]:[]),"Iznos"];
  const rows=[new TableRow({children:headers.map(h=>cell(h,true))}),...doc.items.map(i=>new TableRow({children:[
    cell(`${i.name}${i.sku?` · Šifra: ${i.sku}`:""}${i.description?`\n${i.description}`:""} (${i.unit})`),cell(String(i.quantity)),cell(money(i.price,doc.currency)),
    ...(issuer.vatRegistered?[cell(`${i.vat}%`)]:[]),
    cell(money(Math.round(i.quantity*i.price*100)/100,doc.currency)),
  ]}))];
  children.push(new Table({rows,width:{size:100,type:WidthType.PERCENTAGE}}));
  const subtotal=doc.items.reduce((n,i)=>n+Math.round(i.quantity*i.price*100),0);
  const vat=doc.items.reduce((n,i)=>n+Math.round(Math.round(i.quantity*i.price*100)*i.vat/100),0);
  children.push(new Paragraph({text:`Osnovica: ${money(subtotal/100,doc.currency)}`,alignment:AlignmentType.RIGHT,spacing:{before:300}}));
  if(issuer.vatRegistered)children.push(new Paragraph({text:`PDV: ${money(vat/100,doc.currency)}`,alignment:AlignmentType.RIGHT}));
  children.push(new Paragraph({children:[new TextRun({text:`Ukupno za plaćanje: ${money((subtotal+vat)/100,doc.currency)}`,bold:true})],alignment:AlignmentType.RIGHT,spacing:{after:400}}));
  if(issuer.iban||issuer.bank)children.push(new Paragraph({text:`Podaci za uplatu: ${issuer.bank} ${issuer.iban}`}));
  if(doc.notes)children.push(new Paragraph({text:`Napomena: ${doc.notes}`,spacing:{before:250}}));
  const file=new Document({sections:[{properties:{},children}]});
  const blob=await Packer.toBlob(file);
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=`${doc.title}-${doc.number}`.replace(/[^\p{L}\p{N}._-]/gu,"_")+".docx";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
