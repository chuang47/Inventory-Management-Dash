"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/actions";
import type { Item } from "@/lib/items";
import { CATEGORIES, CONDITIONS, PLATFORMS, SIZE_SUGGESTIONS, SIZE_SYSTEMS, STATUSES, type Category } from "@/lib/constants";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Partial<Item>;
  mode: "create" | "edit";
  brands: string[];
  sources: string[];
  locations: string[];
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ItemForm({ action, initial = {}, mode, brands, sources, locations }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [category, setCategory] = useState<Category>((initial.category as Category) ?? "shoes");
  const [sizeSystem, setSizeSystem] = useState(initial.size_system ?? SIZE_SYSTEMS[category][0]);
  const [status, setStatus] = useState(initial.status ?? "in_stock");
  const [prices, setPrices] = useState({
    cost: initial.purchase_price?.toString() ?? "",
    sold: initial.sold_price?.toString() ?? "",
    fees: initial.fees?.toString() ?? "",
    ship: initial.shipping_cost?.toString() ?? "",
  });

  const systems = SIZE_SYSTEMS[category];
  const sizeOptions = SIZE_SUGGESTIONS[sizeSystem] ?? [];

  const profit = useMemo(() => {
    const n = (s: string) => (s.trim() === "" ? 0 : Number(s));
    if (prices.sold.trim() === "") return null;
    const p = n(prices.sold) - n(prices.cost) - n(prices.fees) - n(prices.ship);
    return Number.isFinite(p) ? p : null;
  }, [prices]);

  function onCategory(c: Category) {
    setCategory(c);
    if (!SIZE_SYSTEMS[c].includes(sizeSystem)) setSizeSystem(SIZE_SYSTEMS[c][0]);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        // Submit manually so React doesn't reset the form when validation fails.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {state.error && (
        <div role="alert" className="rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <Section title="Item">
        <Field label="Category" className="sm:col-span-2" group>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.value} className={`cursor-pointer rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${category === c.value ? "border-bp-accent/70 bg-bp-accent/15 text-bp-accent" : "border-bp-line bg-bp-field text-bp-muted hover:border-bp-accent/60"}`}>
                <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => onCategory(c.value)} className="sr-only" />
                {c.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Brand *">
          <input name="brand" required list="brand-list" defaultValue={initial.brand ?? ""} placeholder="Nike, Jordan, Supreme…" className={input} />
          <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <Field label="Name / model *">
          <input name="name" required defaultValue={initial.name ?? ""} placeholder="Air Jordan 1 Retro High OG" className={input} />
        </Field>
        <Field label="Colorway">
          <input name="colorway" defaultValue={initial.colorway ?? ""} placeholder="Chicago Lost & Found" className={input} />
        </Field>
        <Field label="Style code / SKU">
          <input name="sku" defaultValue={initial.sku ?? ""} placeholder="DZ5485-612" className={`${input} uppercase`} />
        </Field>
        <Field label="Size system">
          <select name="size_system" value={sizeSystem} onChange={(e) => setSizeSystem(e.target.value)} className={input}>
            {systems.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Size *">
          <input name="size" required list="size-list" defaultValue={initial.size ?? ""} placeholder={sizeOptions[Math.floor(sizeOptions.length / 2)] ?? ""} className={input} />
          <datalist id="size-list">{sizeOptions.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="Condition">
          <select name="condition" defaultValue={initial.condition ?? "dswt"} className={input}>
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Storage location">
          <input name="location" list="location-list" defaultValue={initial.location ?? ""} placeholder="Closet, Bin 3…" className={input} />
          <datalist id="location-list">{locations.map((l) => <option key={l} value={l} />)}</datalist>
        </Field>
      </Section>

      <Section title="Purchase">
        <Field label="Cost (per unit)">
          <MoneyInput name="purchase_price" value={prices.cost} onChange={(v) => setPrices({ ...prices, cost: v })} />
        </Field>
        <Field label="Purchase date">
          <input type="date" name="purchase_date" defaultValue={initial.purchase_date ?? today()} className={input} />
        </Field>
        <Field label="Bought from">
          <input name="purchase_source" list="source-list" defaultValue={initial.purchase_source ?? ""} placeholder="SNKRS, Foot Locker, retail…" className={input} />
          <datalist id="source-list">{sources.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        {mode === "create" && (
          <Field label="Quantity" hint="Adds one row per unit, so each can be sold separately.">
            <input type="number" name="quantity" min={1} max={100} defaultValue={1} className={input} />
          </Field>
        )}
      </Section>

      <Section title="Selling">
        <Field label="Status">
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Asking price / market value">
          <MoneyInput name="list_price" defaultValue={initial.list_price?.toString() ?? ""} />
        </Field>
        {status === "listed" && (
          <Field label="Listed on">
            <input name="listed_on" list="platform-list" defaultValue={initial.listed_on ?? ""} placeholder="StockX, eBay…" className={input} />
          </Field>
        )}
        {status !== "listed" && <input type="hidden" name="listed_on" value={initial.listed_on ?? ""} />}

        {status === "sold" && (
          <>
            <Field label="Sold price *">
              <MoneyInput name="sold_price" value={prices.sold} onChange={(v) => setPrices({ ...prices, sold: v })} />
            </Field>
            <Field label="Sold date">
              <input type="date" name="sold_date" defaultValue={initial.sold_date ?? today()} className={input} />
            </Field>
            <Field label="Sold on">
              <input name="sold_platform" list="platform-list" defaultValue={initial.sold_platform ?? initial.listed_on ?? ""} className={input} />
            </Field>
            <Field label="Platform fees">
              <MoneyInput name="fees" value={prices.fees} onChange={(v) => setPrices({ ...prices, fees: v })} />
            </Field>
            <Field label="Shipping cost">
              <MoneyInput name="shipping_cost" value={prices.ship} onChange={(v) => setPrices({ ...prices, ship: v })} />
            </Field>
            <Field label="Net profit">
              <div className={`flex h-10 items-center rounded-sm px-3 text-sm font-semibold tabular-nums ${profit == null ? "bg-bp-field text-bp-muted/70" : profit >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                {profit == null ? "—" : `${profit < 0 ? "−" : ""}$${Math.abs(profit).toFixed(2)}`}
              </div>
            </Field>
          </>
        )}
        <datalist id="platform-list">{PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist>
      </Section>

      <Section title="Notes">
        <Field label="Notes" className="sm:col-span-2">
          <textarea name="notes" rows={3} defaultValue={initial.notes ?? ""} placeholder="Box damage, receipt in email, etc." className={`${input} h-auto py-2`} />
        </Field>
      </Section>

      <div className="flex items-center justify-end gap-3">
        <Link href="/" className="rounded-sm px-4 py-2 text-sm text-bp-muted hover:bg-bp-raised">Cancel</Link>
        <button type="submit" disabled={pending} className="rounded-sm border border-bp-accent/70 bg-bp-accent/15 px-5 py-2 text-sm font-medium text-bp-accent hover:bg-bp-accent/25 disabled:opacity-50">
          {pending ? "Saving…" : mode === "create" ? "Add item" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const input = "h-10 w-full rounded-sm border border-bp-line bg-bp-field px-3 text-sm outline-none placeholder:text-bp-muted/50 focus:border-bp-accent focus:ring-2 focus:ring-bp-accent/20";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="bp-corners rounded-sm border border-bp-line bg-bp-panel/80 p-5">
      <legend className="px-2 font-mono text-[11px] uppercase tracking-[0.2em] text-bp-accent">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, hint, className = "", group, children }: { label: string; hint?: string; className?: string; group?: boolean; children: React.ReactNode }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={`block ${className}`}>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-bp-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-bp-muted">{hint}</span>}
    </Tag>
  );
}

function MoneyInput(props: { name: string; value?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  const { name, value, defaultValue, onChange } = props;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-bp-muted/70">$</span>
      <input
        name={name}
        inputMode="decimal"
        placeholder="0.00"
        {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : { defaultValue })}
        className={`${input} pl-7 tabular-nums`}
      />
    </div>
  );
}
