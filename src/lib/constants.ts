// Shared option lists. Safe to import from client and server code.

export const CATEGORIES = [
  { value: "shoes", label: "Shoes" },
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "accessories", label: "Accessories" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

// Which size systems make sense for each category (first = default).
export const SIZE_SYSTEMS: Record<Category, string[]> = {
  shoes: ["US Men", "US Women", "US Youth (GS)", "UK", "EU"],
  tops: ["Letter"],
  bottoms: ["Waist x Inseam", "Letter", "Waist"],
  outerwear: ["Letter"],
  accessories: ["One Size", "Letter"],
};

// Suggested size values per size system (free text is still allowed).
export const SIZE_SUGGESTIONS: Record<string, string[]> = {
  "US Men": range(3.5, 15, 0.5),
  "US Women": range(5, 15, 0.5),
  "US Youth (GS)": range(3.5, 7, 0.5).map((s) => `${s}Y`),
  UK: range(3, 14, 0.5),
  EU: ["36", "36.5", "37.5", "38", "38.5", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "45.5", "46", "47", "47.5", "48.5"],
  Letter: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  "Waist x Inseam": ["28x30", "28x32", "30x30", "30x32", "32x30", "32x32", "34x32", "36x32"],
  Waist: ["28", "29", "30", "31", "32", "33", "34", "36", "38"],
  "One Size": ["OS"],
};

export const CONDITIONS = [
  { value: "dswt", label: "New (DS / with tags)" },
  { value: "new_no_box", label: "New, no box / no tags" },
  { value: "vnds", label: "Like new (VNDS)" },
  { value: "used", label: "Used" },
] as const;

export const STATUSES = [
  { value: "in_stock", label: "In stock" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export const PLATFORMS = ["StockX", "GOAT", "eBay", "Grailed", "Depop", "Poshmark", "Mercari", "Instagram", "Local / In person", "Other"];

export function labelFor(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((o) => o.value === value)?.label ?? value ?? "";
}

function range(start: number, end: number, step: number): string[] {
  const out: string[] = [];
  for (let v = start; v <= end + 1e-9; v += step) out.push(String(Number(v.toFixed(1))));
  return out;
}
