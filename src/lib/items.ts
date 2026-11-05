import "server-only";
import { getDb } from "./db";

export type Item = {
  id: number;
  category: string;
  brand: string;
  name: string;
  colorway: string | null;
  sku: string | null;
  size_system: string;
  size: string;
  condition: string;
  status: string;
  purchase_price: number | null;
  purchase_date: string | null;
  purchase_source: string | null;
  list_price: number | null;
  listed_on: string | null;
  sold_price: number | null;
  sold_date: string | null;
  sold_platform: string | null;
  fees: number | null;
  shipping_cost: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemInput = Omit<Item, "id" | "created_at" | "updated_at">;

export const ITEM_FIELDS: (keyof ItemInput)[] = [
  "category", "brand", "name", "colorway", "sku", "size_system", "size", "condition", "status",
  "purchase_price", "purchase_date", "purchase_source", "list_price", "listed_on",
  "sold_price", "sold_date", "sold_platform", "fees", "shipping_cost", "location", "notes",
];

/** Net profit for a sold item: sale − cost − fees − shipping. */
export function profitOf(i: Pick<Item, "sold_price" | "purchase_price" | "fees" | "shipping_cost">) {
  if (i.sold_price == null) return null;
  return i.sold_price - (i.purchase_price ?? 0) - (i.fees ?? 0) - (i.shipping_cost ?? 0);
}

export type Filters = {
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  status?: string; // "active" (in stock + listed) | a status | "all"
  sort?: string;
  dir?: string;
};

const SORTABLE: Record<string, string> = {
  brand: "brand COLLATE NOCASE",
  name: "name COLLATE NOCASE",
  size: "size_system, CAST(size AS REAL), size",
  cost: "purchase_price",
  list: "list_price",
  sold: "sold_price",
  profit: "(sold_price - COALESCE(purchase_price,0) - COALESCE(fees,0) - COALESCE(shipping_cost,0))",
  purchased: "purchase_date",
  added: "created_at",
};

function whereClause(f: Filters) {
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (f.q) {
    where.push("(brand LIKE @q OR name LIKE @q OR sku LIKE @q OR colorway LIKE @q OR notes LIKE @q)");
    params.q = `%${f.q}%`;
  }
  if (f.category) { where.push("category = @category"); params.category = f.category; }
  if (f.brand) { where.push("brand = @brand COLLATE NOCASE"); params.brand = f.brand; }
  if (f.size) { where.push("size = @size COLLATE NOCASE"); params.size = f.size; }
  const status = f.status || "active";
  if (status === "active") where.push("status IN ('in_stock','listed')");
  else if (status !== "all") { where.push("status = @status"); params.status = status; }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function listItems(f: Filters): Item[] {
  const { sql, params } = whereClause(f);
  const col = SORTABLE[f.sort ?? ""] ?? SORTABLE.added;
  const dir = f.dir === "asc" ? "ASC" : "DESC";
  return getDb().prepare(`SELECT * FROM items ${sql} ORDER BY ${col} ${dir}, id DESC`).all(params) as Item[];
}

export function getItem(id: number): Item | undefined {
  return getDb().prepare("SELECT * FROM items WHERE id = ?").get(id) as Item | undefined;
}

export function insertItems(input: ItemInput, quantity: number): number[] {
  const cols = ITEM_FIELDS.join(", ");
  const vals = ITEM_FIELDS.map((k) => `@${k}`).join(", ");
  const stmt = getDb().prepare(`INSERT INTO items (${cols}) VALUES (${vals})`);
  const tx = getDb().transaction(() => {
    const ids: number[] = [];
    for (let n = 0; n < quantity; n++) ids.push(Number(stmt.run(input).lastInsertRowid));
    return ids;
  });
  return tx();
}

export function updateItem(id: number, input: ItemInput) {
  const sets = ITEM_FIELDS.map((k) => `${k} = @${k}`).join(", ");
  getDb().prepare(`UPDATE items SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run({ ...input, id });
}

export function deleteItem(id: number) {
  getDb().prepare("DELETE FROM items WHERE id = ?").run(id);
}

export function distinctBrands(): string[] {
  return (getDb().prepare("SELECT DISTINCT brand FROM items ORDER BY brand COLLATE NOCASE").all() as { brand: string }[]).map((r) => r.brand);
}

export function distinctSizes(): string[] {
  return (getDb().prepare("SELECT DISTINCT size FROM items ORDER BY CAST(size AS REAL), size").all() as { size: string }[]).map((r) => r.size);
}

export function distinctValues(col: "purchase_source" | "location"): string[] {
  return (getDb().prepare(`SELECT DISTINCT ${col} AS v FROM items WHERE ${col} IS NOT NULL AND ${col} != '' ORDER BY v COLLATE NOCASE`).all() as { v: string }[]).map((r) => r.v);
}

export type Stats = {
  activeCount: number;
  listedCount: number;
  inventoryCost: number;
  inventoryValue: number;
  soldCount: number;
  revenue: number;
  profit: number;
  soldCost: number;
  byBrand: { brand: string; count: number; cost: number }[];
  byCategory: { category: string; count: number }[];
};

export function getStats(): Stats {
  const a = getDb().prepare(`
    SELECT
      COUNT(*) AS activeCount,
      SUM(status = 'listed') AS listedCount,
      COALESCE(SUM(purchase_price), 0) AS inventoryCost,
      COALESCE(SUM(COALESCE(list_price, purchase_price)), 0) AS inventoryValue
    FROM items WHERE status IN ('in_stock','listed')`).get() as Record<string, number>;
  const s = getDb().prepare(`
    SELECT
      COUNT(*) AS soldCount,
      COALESCE(SUM(sold_price), 0) AS revenue,
      COALESCE(SUM(purchase_price), 0) AS soldCost,
      COALESCE(SUM(sold_price - COALESCE(purchase_price,0) - COALESCE(fees,0) - COALESCE(shipping_cost,0)), 0) AS profit
    FROM items WHERE status = 'sold'`).get() as Record<string, number>;
  const byBrand = getDb().prepare(`
    SELECT brand, COUNT(*) AS count, COALESCE(SUM(purchase_price),0) AS cost
    FROM items WHERE status IN ('in_stock','listed')
    GROUP BY brand COLLATE NOCASE ORDER BY count DESC LIMIT 8`).all() as Stats["byBrand"];
  const byCategory = getDb().prepare(`
    SELECT category, COUNT(*) AS count
    FROM items WHERE status IN ('in_stock','listed')
    GROUP BY category ORDER BY count DESC`).all() as Stats["byCategory"];
  return {
    activeCount: a.activeCount ?? 0,
    listedCount: a.listedCount ?? 0,
    inventoryCost: a.inventoryCost,
    inventoryValue: a.inventoryValue,
    soldCount: s.soldCount,
    revenue: s.revenue,
    profit: s.profit,
    soldCost: s.soldCost,
    byBrand,
    byCategory,
  };
}
