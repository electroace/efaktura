import { env } from "cloudflare:workers";
import { getAppUser, signInPath, type AppUser } from "@/lib/app-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Company = {
  user_id: string; email: string; name: string; address: string; city: string; postal_code: string;
  jib: string; vat_id: string; vat_registered: number; iban: string; bank: string;
  phone: string; contact_email: string; contact_person: string; default_note: string;
  responsible_person: string; electronic_notice: number; show_signature_line: number;
  invoice_title: string; offer_title: string; show_discount: number;
  logo_key: string | null; status: string;
  plan: string; price_bam: number; paid_until: string | null; created_at: string; updated_at: string;
};

export type DocumentRecord = {
  id: string; user_id: string; type: string; title: string; number: string;
  issue_date: string; due_date: string; client_name: string; client_address: string;
  client_id: string; client_contact: string; show_client_contact: number; show_issuer_contact: number;
  fiscal_number: string; currency: string; items_json: string; notes: string;
  issuer_json: string;
  month: string; created_at: string; updated_at: string;
};

export type Customer = {
  id: string; user_id: string; name: string; address: string; city: string; postal_code: string;
  jib: string; vat_id: string; email: string; phone: string; contact_person: string;
  contact_email: string; contact_phone: string; notes: string; created_at: string; updated_at: string;
};

export type CatalogItem = {
  id: string; user_id: string; kind: "goods" | "service"; name: string; description: string;
  sku: string; unit: string; price: number; vat: number; created_at: string; updated_at: string;
};

export function db(): D1Database {
  if (!env.DB) throw new Error("Baza trenutno nije dostupna.");
  return env.DB;
}

const companyColumns = [
  ["invoice_title", "text DEFAULT 'Faktura' NOT NULL"],
  ["offer_title", "text DEFAULT 'Ponuda' NOT NULL"],
  ["show_discount", "integer DEFAULT false NOT NULL"],
] as const;
let companyColumnsReady = false;
async function ensureCompanyColumns() {
  if (companyColumnsReady) return;
  const found = await db().prepare("SELECT name FROM pragma_table_info('companies')").all<{name:string}>();
  const names = new Set(found.results.map(row => row.name));
  for (const [name, definition] of companyColumns) {
    if (names.has(name)) continue;
    try { await db().prepare(`ALTER TABLE companies ADD ${name} ${definition}`).run(); }
    catch (error) {
      // Two Workers can see the old schema simultaneously. Accept only a completed concurrent migration.
      const updated = await db().prepare("SELECT name FROM pragma_table_info('companies') WHERE name=?").bind(name).first();
      if (!updated) throw error;
    }
  }
  companyColumnsReady = true;
}

export async function workspaceUser(): Promise<AppUser | null> {
  const user = await getAppUser();
  if (!user || !isAdmin(user.email,user.userId)) return user;
  const selected = (await cookies()).get("efaktura-acting-as")?.value;
  if (!selected || selected === user.userId) return user;
  const tenant = await db().prepare("SELECT user_id,email FROM companies WHERE user_id=? AND status='approved'")
    .bind(selected).first<{user_id:string;email:string}>();
  return tenant ? { ...user, userId:tenant.user_id, email:tenant.email, impersonating:true, adminEmail:user.email } : user;
}

export async function requireWorkspaceUser(returnTo: string): Promise<AppUser> {
  const user = await workspaceUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export async function identity() {
  const user = await workspaceUser();
  return user ? { id: user.userId, email: user.email } : null;
}

export async function realIdentity() {
  const user = await getAppUser();
  return user ? { id:user.userId, email:user.email } : null;
}

export async function companyFor(userId: string): Promise<Company | null> {
  await ensureCompanyColumns();
  return db().prepare("SELECT * FROM companies WHERE user_id = ?").bind(userId).first<Company>();
}

export function paidActive(company: Company) {
  return company.plan === "paid" && !!company.paid_until && company.paid_until > new Date().toISOString();
}

export function addCalendarMonth(value: string) {
  const date = new Date(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

// The email alone is unsafe while email verification is disabled in Supabase.
// Bind administration to the pre-existing account ID as well as the email.
export const isAdmin = (email: string, userId: string) =>
  userId === "ed10372e-64fc-4fcf-8216-8d1bb3bedf7a" && email.toLowerCase() === "electroace@gmail.com";

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
