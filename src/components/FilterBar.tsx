"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

const STATUS_TABS = [
  { value: "active", label: "In inventory" },
  { value: "in_stock", label: "Unlisted" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
  { value: "all", label: "All" },
];

export default function FilterBar({ brands, sizes }: { brands: string[]; sizes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    for (const k of ["added", "saved", "deleted"]) next.delete(k);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Debounce the search box.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => set("q", q.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = params.get("status") ?? "active";
  const hasFilters = ["q", "category", "brand", "size"].some((k) => params.get(k));
  const select = "h-9 rounded-sm border border-bp-line bg-bp-field px-2.5 text-sm outline-none focus:border-bp-accent";

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto rounded-sm border border-bp-line bg-bp-panel/80 p-1 font-mono text-xs uppercase tracking-wider">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => set("status", t.value === "active" ? "" : t.value)}
            className={`whitespace-nowrap rounded-sm px-3 py-1.5 ${status === t.value ? "bg-bp-accent/15 text-bp-accent" : "text-bp-muted hover:text-bp-accent"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brand, model, SKU, colorway…"
          className="h-9 min-w-56 flex-1 rounded-sm border border-bp-line bg-bp-field px-3 text-sm placeholder:text-bp-muted/60 outline-none focus:border-bp-accent"
        />
        <select value={params.get("category") ?? ""} onChange={(e) => set("category", e.target.value)} className={select} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={params.get("brand") ?? ""} onChange={(e) => set("brand", e.target.value)} className={select} aria-label="Brand">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={params.get("size") ?? ""} onChange={(e) => set("size", e.target.value)} className={select} aria-label="Size">
          <option value="">All sizes</option>
          {sizes.map((s) => <option key={s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              router.replace(status === "active" ? pathname : `${pathname}?status=${status}`, { scroll: false });
            }}
            className="h-9 rounded-sm px-3 text-sm text-bp-muted hover:bg-bp-raised"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
