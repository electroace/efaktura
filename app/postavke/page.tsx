import { requireAppUser } from "@/lib/app-auth";
import { companyFor, paidActive } from "@/lib/server";
import { Onboarding } from "../ui/onboarding";
import { AppHeader } from "../ui/app-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAppUser("/postavke");
  const company = await companyFor(user.userId);
  return <div className="app-frame"><AppHeader user={user} hasCompany={!!company} paid={!!company && paidActive(company)}/>
    <main className="app-main"><Onboarding email={user.email} settings initial={company ? {
      name:company.name,address:company.address,city:company.city,postalCode:company.postal_code,jib:company.jib,
      vatId:company.vat_id,vatRegistered:!!company.vat_registered,iban:company.iban,bank:company.bank,
      phone:company.phone,contactEmail:company.contact_email,contactPerson:company.contact_person,
      defaultNote:company.default_note,responsiblePerson:company.responsible_person,
      electronicNotice:!!company.electronic_notice,showSignatureLine:!!company.show_signature_line,
    } : undefined} hasLogo={!!company?.logo_key}/></main></div>;
}
