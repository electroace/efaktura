import Link from "next/link";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor } from "@/lib/server";
import { Onboarding } from "../ui/onboarding";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAppUser("/postavke");
  const company = await companyFor(user.userId);
  return <div className="app-frame"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link><Link href="/">← Dokumenti</Link></header>
    <main className="app-main"><Onboarding email={user.email} settings initial={company ? {
      name:company.name,address:company.address,city:company.city,postalCode:company.postal_code,jib:company.jib,
      vatId:company.vat_id,vatRegistered:!!company.vat_registered,iban:company.iban,bank:company.bank,
      phone:company.phone,contactEmail:company.contact_email,
    } : undefined}/></main></div>;
}
