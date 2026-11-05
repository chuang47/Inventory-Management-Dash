"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIES, CONDITIONS, SIZE_SYSTEMS, STATUSES, type Category } from "@/lib/constants";
import { deleteItem, insertItems, updateItem, type ItemInput } from "@/lib/items";

export type FormState = { error?: string };

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function money(fd: FormData, key: string, label: string): number | null {
  const v = str(fd, key);
  if (v == null) return null;
  const n = Number(v.replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a positive number.`);
  return Math.round(n * 100) / 100;
}

function parseItem(fd: FormData): ItemInput {
  const category = str(fd, "category") as Category | null;
  if (!category || !CATEGORIES.some((c) => c.value === category)) throw new Error("Pick a category.");
  const brand = str(fd, "brand");
  if (!brand) throw new Error("Brand is required.");
  const name = str(fd, "name");
  if (!name) throw new Error("Name / model is required.");
  const size_system = str(fd, "size_system") ?? SIZE_SYSTEMS[category][0];
  const size = str(fd, "size");
  if (!size) throw new Error("Size is required.");

  const condition = str(fd, "condition") ?? "dswt";
  if (!CONDITIONS.some((c) => c.value === condition)) throw new Error("Invalid condition.");
  const status = str(fd, "status") ?? "in_stock";
  if (!STATUSES.some((s) => s.value === status)) throw new Error("Invalid status.");

  const sold_price = money(fd, "sold_price", "Sold price");
  if (status === "sold" && sold_price == null) throw new Error("Enter the sold price to mark an item as sold.");

  const isSold = status === "sold";
  return {
    category,
    brand,
    name,
    colorway: str(fd, "colorway"),
    sku: str(fd, "sku")?.toUpperCase() ?? null,
    size_system,
    size,
    condition,
    status,
    purchase_price: money(fd, "purchase_price", "Purchase price"),
    purchase_date: str(fd, "purchase_date"),
    purchase_source: str(fd, "purchase_source"),
    list_price: money(fd, "list_price", "List price / market value"),
    listed_on: str(fd, "listed_on"),
    // Sale fields only stick when the item is actually sold.
    sold_price: isSold ? sold_price : null,
    sold_date: isSold ? str(fd, "sold_date") ?? new Date().toISOString().slice(0, 10) : null,
    sold_platform: isSold ? str(fd, "sold_platform") : null,
    fees: isSold ? money(fd, "fees", "Fees") : null,
    shipping_cost: isSold ? money(fd, "shipping_cost", "Shipping cost") : null,
    location: str(fd, "location"),
    notes: str(fd, "notes"),
  };
}

export async function createItemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  let ids: number[];
  try {
    const qty = Number(str(fd, "quantity") ?? "1");
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) throw new Error("Quantity must be a whole number from 1 to 100.");
    ids = insertItems(parseItem(fd), qty);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/");
  redirect(ids.length === 1 ? `/?added=1` : `/?added=${ids.length}`);
}

export async function updateItemAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    updateItem(id, parseItem(fd));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/");
  redirect("/?saved=1");
}

export async function deleteItemAction(id: number) {
  deleteItem(id);
  revalidatePath("/");
  redirect("/?deleted=1");
}
