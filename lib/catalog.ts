import { clean, type CatalogItem, type Customer } from "@/lib/server";

export type CustomerInput = Pick<Customer, "name" | "address" | "city" | "postal_code" | "jib" | "vat_id" | "email" | "phone" | "contact_person" | "contact_email" | "contact_phone" | "notes">;
export type CatalogInput = Pick<CatalogItem, "kind" | "name" | "description" | "sku" | "unit" | "price" | "vat">;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Unesite podatke u obrazac.");
  return value as Record<string, unknown>;
}

function email(value: unknown) {
  const result = clean(value, 120);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error("Provjerite email adresu.");
  return result;
}

export function customerInput(value: unknown): CustomerInput {
  const data = object(value);
  const name = clean(data.name, 180);
  if (!name) throw new Error("Unesite naziv kupca.");
  return {
    name, address: clean(data.address, 250), city: clean(data.city, 120),
    postal_code: clean(data.postal_code, 20), jib: clean(data.jib, 32), vat_id: clean(data.vat_id, 32),
    email: email(data.email), phone: clean(data.phone, 40), contact_person: clean(data.contact_person, 120),
    contact_email: email(data.contact_email), contact_phone: clean(data.contact_phone, 40),
    notes: clean(data.notes, 1000),
  };
}

export function catalogInput(value: unknown): CatalogInput {
  const data = object(value);
  const name = clean(data.name, 180);
  const kind = data.kind === "goods" ? "goods" : data.kind === "service" ? "service" : null;
  const price = Number(data.price);
  const vat = Number(data.vat);
  if (!name || !kind) throw new Error("Unesite naziv i izaberite robu ili uslugu.");
  if (!Number.isFinite(price) || price < 0 || price > 100000000 || !Number.isFinite(vat) || vat < 0 || vat > 100) {
    throw new Error("Provjerite cijenu i stopu PDV-a.");
  }
  return {
    kind, name, description: clean(data.description, 500), sku: clean(data.sku, 60),
    unit: clean(data.unit, 24) || "kom", price, vat,
  };
}
