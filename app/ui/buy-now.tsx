"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PlanRequest } from "@/lib/billing";

export function BuyNow({paid}:{paid:boolean}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function buy() {
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/plan-requests",{method:"POST"});
      const data=await response.json() as {request?:PlanRequest;error?:string};
      if(!response.ok||!data.request)throw new Error(data.error??"Predračun nije dostupan.");
      const {downloadProforma}=await import("./proforma-pdf");
      await downloadProforma(data.request);
      setMessage("Predračun je pripremljen. Za ponovni PDF otvorite Pretplatu.");
    }catch(error){setMessage(error instanceof Error?error.message:"Pokušajte ponovo.");}
    finally{setBusy(false);}
  }
  return <div className="header-purchase"><button type="button" className="header-upgrade" disabled={busy} onClick={()=>void buy()}>{busy?"Priprema predračuna...":paid?"Produži paket":"Kupi neograničenu verziju"}<ArrowUpRight size={15}/></button>{message&&<div role="status" className="header-purchase-message">{message} <a href="/pretplata">Pretplata →</a></div>}</div>;
}
