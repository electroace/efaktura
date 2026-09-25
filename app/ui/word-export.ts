import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, Packer, ImageRun, WidthType, BorderStyle } from "docx";

type Item = {name:string;description?:string;sku?:string;quantity:number;unit:string;price:number;vat:number};
type Issuer = {name:string;address:string;city:string;postalCode:string;jib:string;vatId:string;vatRegistered:boolean;iban:string;bank:string;phone:string;email:string;contactPerson?:string;responsiblePerson?:string;electronicNotice?:boolean;signatureLine?:boolean;logoKey:string|null};
type DocData = {id?:string;type:string;title:string;number:string;issueDate:string;dueDate:string;clientName:string;clientAddress:string;clientId:string;clientContact:string;showClientContact:boolean;showIssuerContact:boolean;fiscalNumber:string;currency:string;items:Item[];notes:string};
const money = (n:number,currency:string) => new Intl.NumberFormat("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" "+currency;
const cell=(value:string,header=false)=>new TableCell({shading:header?{fill:"193C50"}:undefined,children:[new Paragraph({children:[new TextRun({text:value,bold:header,color:header?"FFFFFF":"243F52",size:header?18:19})],spacing:{after:0}})]});
const label=(value:string)=>new Paragraph({children:[new TextRun({text:value,bold:true,color:"0D878C",size:17})],spacing:{before:120,after:70}});

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
  children.push(new Paragraph({children:[new TextRun({text:issuer.name,bold:true,size:26,color:"193C50"})],spacing:{after:90},border:{bottom:{style:BorderStyle.SINGLE,color:"0D878C",size:13,space:12}}}));
  children.push(new Paragraph({text:`${issuer.address}, ${issuer.postalCode} ${issuer.city}  ·  JIB: ${issuer.jib}${issuer.vatId?`  ·  PDV: ${issuer.vatId}`:""}`,spacing:{before:150,after:40}}));
  children.push(new Paragraph({text:`${issuer.phone}${issuer.phone&&issuer.email?"  ·  ":""}${issuer.email}`,spacing:{after:90}}));
  if(doc.showIssuerContact&&issuer.contactPerson)children.push(new Paragraph({text:`Kontakt osoba: ${issuer.contactPerson}`}));
  children.push(new Paragraph({children:[new TextRun({text:doc.title.toLocaleUpperCase("bs"),bold:true,size:38,color:"193C50"})],spacing:{before:360,after:50}}));
  children.push(new Paragraph({children:[new TextRun({text:doc.number,color:"0D878C",bold:true,size:23})],spacing:{after:240}}));
  const buyer=[label("IZDATO ZA"),new Paragraph({children:[new TextRun({text:doc.clientName,bold:true,size:21,color:"193C50"})]})];
  if(doc.clientAddress)buyer.push(new Paragraph({text:doc.clientAddress}));
  if(doc.clientId)buyer.push(new Paragraph({text:`JIB: ${doc.clientId}`}));
  if(doc.showClientContact&&doc.clientContact)buyer.push(new Paragraph({text:`Kontakt osoba: ${doc.clientContact}`}));
  const facts=[label("DATUMI I DETALJI"),new Paragraph({text:`Datum izdavanja: ${doc.issueDate.split("-").reverse().join(".")}`})];
  if(doc.dueDate)facts.push(new Paragraph({text:`${doc.type==="offer"?"Ponuda važi do":"Rok plaćanja"}: ${doc.dueDate.split("-").reverse().join(".")}`}));
  if(doc.fiscalNumber)facts.push(new Paragraph({text:`BF: ${doc.fiscalNumber}`}));
  children.push(new Table({rows:[new TableRow({children:[new TableCell({shading:{fill:"F1F7F8"},children:buyer}),new TableCell({shading:{fill:"F1F7F8"},children:facts})]})],width:{size:100,type:WidthType.PERCENTAGE}}));
  children.push(new Paragraph({text:"",spacing:{after:120}}));
  const headers=["Opis","Kol.","Cijena",...(issuer.vatRegistered?["PDV"]:[]),"Iznos"];
  const rows=[new TableRow({children:headers.map(h=>cell(h,true))}),...doc.items.map(i=>new TableRow({children:[
    cell(`${i.name}${i.sku?` · Šifra: ${i.sku}`:""}${i.description?`\n${i.description}`:""} (${i.unit})`),cell(String(i.quantity)),cell(money(i.price,doc.currency)),
    ...(issuer.vatRegistered?[cell(`${i.vat}%`)]:[]),
    cell(money(Math.round(i.quantity*i.price*100)/100,doc.currency)),
  ]}))];
  children.push(new Table({rows,width:{size:100,type:WidthType.PERCENTAGE}}));
  const subtotal=doc.items.reduce((n,i)=>n+Math.round(i.quantity*i.price*100),0);
  const vat=doc.items.reduce((n,i)=>n+Math.round(Math.round(i.quantity*i.price*100)*i.vat/100),0);
  children.push(new Paragraph({text:`Osnovica: ${money(subtotal/100,doc.currency)}`,alignment:AlignmentType.RIGHT,spacing:{before:260}}));
  if(issuer.vatRegistered)children.push(new Paragraph({text:`PDV: ${money(vat/100,doc.currency)}`,alignment:AlignmentType.RIGHT}));
  children.push(new Paragraph({children:[new TextRun({text:`UKUPNO ZA PLAĆANJE   ${money((subtotal+vat)/100,doc.currency)}`,bold:true,color:"0B6970",size:24})],alignment:AlignmentType.RIGHT,spacing:{before:120,after:270},border:{top:{style:BorderStyle.SINGLE,color:"B5D6D7",size:8,space:10}}}));
  if(issuer.iban||issuer.bank){children.push(label("PODACI ZA UPLATU"));children.push(new Paragraph({text:`${issuer.bank}   ${issuer.iban}`}));}
  if(doc.notes){children.push(label("NAPOMENA"));children.push(new Paragraph({text:doc.notes,spacing:{after:260}}));}
  if(issuer.signatureLine)children.push(new Paragraph({text:"",spacing:{before:420,after:180},indent:{left:5500},border:{bottom:{style:BorderStyle.SINGLE,color:"24465A",size:9,space:8}}}));
  if(issuer.responsiblePerson||issuer.signatureLine){children.push(new Paragraph({text:issuer.responsiblePerson||"Odgovorno lice",alignment:AlignmentType.RIGHT,spacing:{before:issuer.signatureLine?0:330,after:40}}));children.push(new Paragraph({children:[new TextRun({text:"ODGOVORNO LICE"+(issuer.signatureLine?" · PEČAT I POTPIS":""),size:16,color:"8299A7"})],alignment:AlignmentType.RIGHT,spacing:{after:300}}));}
  if(issuer.electronicNotice)children.push(new Paragraph({children:[new TextRun({text:"Dokument je elektronski izdat i važi bez pečata i potpisa.",italics:true,size:18,color:"718B99"})],alignment:AlignmentType.CENTER,border:{top:{style:BorderStyle.SINGLE,color:"DCE7EB",size:6,space:11}}}));
  const file=new Document({sections:[{properties:{},children}]});
  const blob=await Packer.toBlob(file);
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=`${doc.title}-${doc.number}`.replace(/[^\p{L}\p{N}._-]/gu,"_")+".docx";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
