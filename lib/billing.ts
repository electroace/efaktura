import { env } from "cloudflare:workers";
import { db } from "@/lib/server";

export type BillingSettings = {
  name: string; address: string; city: string; postal_code: string;
  jib: string; vat_id: string; iban: string; bank: string; email: string;
};

export type PlanRequest = {
  id: string; user_id: string; number: string; amount_cents: number;
  base_cents: number; vat_cents: number; issuer_json: string; customer_json: string;
  status: string; email_status: string; created_at: string; updated_at: string;
};

export const defaultBillingSettings: BillingSettings = {
  name: "BRATTS d.o.o.", address: "", city: "", postal_code: "", jib: "",
  vat_id: "", iban: "", bank: "", email: "electroace@gmail.com",
};

export async function billingSettings() {
  const row = await db().prepare("SELECT * FROM billing_settings WHERE id=1").first<BillingSettings>();
  return row ?? defaultBillingSettings;
}

export function billingReady(settings: BillingSettings) {
  return Boolean(settings.name && settings.address && settings.city && settings.jib && settings.vat_id && settings.iban && settings.bank && settings.email);
}

export function formatBam(cents: number) {
  return `${new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} KM`;
}

export async function notifyAdmin(request: PlanRequest, customerName: string, customerEmail: string) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return "not_configured";
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.MAIL_FROM, to: ["electroace@gmail.com"],
        subject: `eFaktura: zahtjev za plaćeni paket ${request.number}`,
        text: `Firma ${customerName} (${customerEmail}) zatražila je plaćeni paket. Predračun ${request.number}, iznos ${formatBam(request.amount_cents)} s PDV-om. Zahtjev je u administraciji; paket uključite nakon evidentirane uplate.`,
      }),
    });
    if (!result.ok) { console.error("Resend notification failed", result.status); return "failed"; }
    return "sent";
  } catch (error) { console.error("Resend notification unavailable", error); return "failed"; }
}
