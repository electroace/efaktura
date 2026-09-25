import { env } from "cloudflare:workers";
import { getAppUser } from "@/lib/app-auth";

export type Company = {
  user_id: string; email: string; name: string; address: string; city: string; postal_code: string;
  jib: string; vat_id: string; vat_registered: number; iban: string; bank: string;
  phone: string; contact_email: string; logo_key: string | null; status: string;
  plan: string; price_bam: number; created_at: string; updated_at: string;
};

export type DocumentRecord = {
  id: string; user_id: string; type: string; title: string; number: string;
  issue_date: string; due_date: string; client_name: string; client_address: string;
  client_id: string; currency: string; items_json: string; notes: string;
  issuer_json: string;
  month: string; created_at: string; updated_at: string;
};

export function db(): D1Database {
  if (!env.DB) throw new Error("Baza trenutno nije dostupna.");
  return env.DB;
}

export async function identity() {
  const user = await getAppUser();
  return user ? { id: user.userId, email: user.email } : null;
}

export async function companyFor(userId: string): Promise<Company | null> {
  return db().prepare("SELECT * FROM companies WHERE user_id = ?").bind(userId).first<Company>();
}

export const isAdmin = (email: string) => email.toLowerCase() === "electroace@gmail.com";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sarajevo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}`;
}

export function clean(input: unknown, max = 300) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}
