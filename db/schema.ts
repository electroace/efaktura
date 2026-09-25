import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const companies = sqliteTable("companies", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull().default(""),
  jib: text("jib").notNull(),
  vatId: text("vat_id").notNull().default(""),
  vatRegistered: integer("vat_registered", { mode: "boolean" }).notNull().default(false),
  iban: text("iban").notNull().default(""),
  bank: text("bank").notNull().default(""),
  phone: text("phone").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  logoKey: text("logo_key"),
  status: text("status").notNull().default("approved"),
  plan: text("plan").notNull().default("free"),
  priceBam: real("price_bam").notNull().default(22),
  paidUntil: text("paid_until"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_companies_status").on(t.status)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  number: text("number").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull().default(""),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address").notNull().default(""),
  clientId: text("client_id").notNull().default(""),
  currency: text("currency").notNull().default("KM"),
  itemsJson: text("items_json").notNull(),
  issuerJson: text("issuer_json").notNull(),
  notes: text("notes").notNull().default(""),
  month: text("month").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [
  uniqueIndex("idx_documents_owner_number").on(t.userId, t.number),
  index("idx_documents_owner_date").on(t.userId, t.createdAt),
  index("idx_documents_owner_month").on(t.userId, t.month),
]);

export const billingSettings = sqliteTable("billing_settings", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("BRATTS d.o.o."),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  jib: text("jib").notNull().default(""),
  vatId: text("vat_id").notNull().default(""),
  iban: text("iban").notNull().default(""),
  bank: text("bank").notNull().default(""),
  email: text("email").notNull().default("electroace@gmail.com"),
  updatedAt: text("updated_at").notNull(),
});

export const planRequests = sqliteTable("plan_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  number: text("number").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  baseCents: integer("base_cents").notNull(),
  vatCents: integer("vat_cents").notNull(),
  issuerJson: text("issuer_json").notNull(),
  customerJson: text("customer_json").notNull(),
  status: text("status").notNull().default("pending"),
  emailStatus: text("email_status").notNull().default("not_configured"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [
  index("idx_plan_requests_user").on(t.userId, t.createdAt),
  uniqueIndex("idx_plan_requests_one_pending").on(t.userId).where(sql`${t.status} = 'pending'`),
]);
