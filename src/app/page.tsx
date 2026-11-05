import Link from "next/link";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { CATEGORIES, CONDITIONS, STATUSES, labelFor } from "@/lib/constants";
import { money, shortDate, signedMoney } from "@/lib/format";
import { distinctBrands, distinctSizes, getStats, listItems, profitOf, type Filters } from "@/lib/items";

export const dynamic = "force-dynamic";

type SP = Filters & { added?: string; saved?: string; deleted?: string };

export default async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const stats = getStats();
  const items = listItems(sp);
  const brands = distinctBrands();
  const sizes = distinctSizes();
  const status = sp.status || "active";
  const showSale = status === "sold" || status === "all";

  const flash = sp.added
    ? `Added ${sp.added} item${sp.added === "1" ? "" : "s"}.`
    : sp.saved ? "Changes saved." : sp.deleted ? "Item deleted." : null;

  const unrealized = stats.inventoryValue - stats.inventoryCost;
  const roi = stats.soldCost > 0 ? (stats.profit / stats.soldCost) * 100 : null;
  const maxBrand = Math.max(1, ...stats.byBrand.map((b) => b.count));
  const totalAll = stats.activeCount + stats.soldCount;

  return (
    <div className="space-y-6">
      {flash && <div className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300">{flash}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="In inventory" value={String(stats.activeCount)} sub={`${stats.listedCount} listed`} />
        <Stat label="Inventory cost" value={money(stats.inventoryCost, true)} sub="what you paid" />
        <Stat
          label="Est. value"
          value={money(stats.inventoryValue, true)}
          sub={`${signedMoney(unrealized)} unrealized`}
          tone={unrealized > 0 ? "good" : unrealized < 0 ? "bad" : undefined}
        />
        <Stat label="Sold" value={String(stats.soldCount)} sub={`${money(stats.revenue, true)} revenue`} />
        <Stat
          label="Net profit"
          value={signedMoney(stats.profit)}
          sub={roi == null ? "after fees & shipping" : `${roi.toFixed(0)}% ROI`}
          tone={stats.profit > 0 ? "good" : stats.profit < 0 ? "bad" : undefined}
        />
      </section>

      {totalAll === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <section className="min-w-0 space-y-3">
            <Suspense>
              <FilterBar brands={brands} sizes={sizes} />
            </Suspense>

            <div className="overflow-x-auto rounded-sm border border-bp-line bg-bp-panel/80">
              <table className="w-full text-sm">
                <thead className="border-b border-bp-line bg-bp-raised/70 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-bp-muted">
                  <tr>
                    <Th sp={sp} col="brand">Item</Th>
                    <Th sp={sp} col="size">Size</Th>
                    <th className="px-3 py-2.5 font-medium">Condition</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <Th sp={sp} col="cost" right>Cost</Th>
                    <Th sp={sp} col="list" right>Ask / value</Th>
                    {showSale && <Th sp={sp} col="sold" right>Sold</Th>}
                    {showSale && <Th sp={sp} col="profit" right>Profit</Th>}
                    <Th sp={sp} col="purchased" right>Bought</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bp-line/60">
                  {items.map((i) => {
                    const p = profitOf(i);
                    return (
                      <tr key={i.id} className="group hover:bg-bp-accent/5">
                        <td className="px-3 py-2.5">
                          <Link href={`/items/${i.id}`} className="block">
                            <span className="font-medium group-hover:underline">{i.brand} {i.name}</span>
                            <span className="block text-xs text-bp-muted">
                              {[labelFor(CATEGORIES, i.category), i.colorway, i.sku].filter(Boolean).join(" · ")}
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="font-medium">{i.size}</span>{" "}
                          <span className="text-xs text-bp-muted">{i.size_system}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-bp-muted">{labelFor(CONDITIONS, i.condition)}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={i.status} /></td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(i.purchase_price)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(i.list_price)}</td>
                        {showSale && <td className="px-3 py-2.5 text-right tabular-nums">{money(i.sold_price)}</td>}
                        {showSale && (
                          <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${p == null ? "" : p >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {signedMoney(p)}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-bp-muted">{shortDate(i.purchase_date)}</td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-bp-muted">No items match these filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-bp-muted">{items.length} item{items.length === 1 ? "" : "s"} shown</p>
          </section>

          <aside className="space-y-4">
            <Panel title="Inventory by brand">
              {stats.byBrand.length === 0 && <p className="text-sm text-bp-muted">Nothing in stock.</p>}
              <ul className="space-y-2.5">
                {stats.byBrand.map((b) => (
                  <li key={b.brand}>
                    <Link href={`/?brand=${encodeURIComponent(b.brand)}`} className="block hover:opacity-80">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="truncate">{b.brand}</span>
                        <span className="tabular-nums text-bp-muted">{b.count}</span>
                      </div>
                      <div className="h-1.5 bg-bp-raised">
                        <div className="h-1.5 bg-bp-accent/80" style={{ width: `${(b.count / maxBrand) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="By category">
              <ul className="space-y-1.5 text-sm">
                {stats.byCategory.map((c) => (
                  <li key={c.category}>
                    <Link href={`/?category=${c.category}`} className="flex justify-between hover:underline">
                      <span>{labelFor(CATEGORIES, c.category)}</span>
                      <span className="tabular-nums text-bp-muted">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "good" | "bad" }) {
  return (
    <div className="bp-corners rounded-sm border border-bp-line bg-bp-panel/80 p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-bp-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : ""}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[11px] text-bp-muted">{sub}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bp-corners rounded-sm border border-bp-line bg-bp-panel/80 p-4">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-bp-muted">{title}</h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock: "bg-bp-raised text-bp-muted",
    listed: "bg-sky-400/10 text-sky-300",
    sold: "bg-emerald-400/10 text-emerald-300",
  };
  return <span className={`whitespace-nowrap rounded-sm border border-current/30 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${styles[status] ?? ""}`}>{labelFor(STATUSES, status)}</span>;
}

function Th({ sp, col, right, children }: { sp: SP; col: string; right?: boolean; children: React.ReactNode }) {
  const active = sp.sort === col;
  const dir = active && sp.dir === "asc" ? "desc" : "asc";
  const next = new URLSearchParams();
  for (const k of ["q", "category", "brand", "size", "status"] as const) if (sp[k]) next.set(k, sp[k]!);
  next.set("sort", col);
  next.set("dir", dir);
  return (
    <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : ""}`}>
      <Link href={`/?${next.toString()}`} className={`hover:text-bp-accent ${active ? "text-bp-text" : ""}`}>
        {children}
        {active && <span className="ml-0.5">{sp.dir === "asc" ? "↑" : "↓"}</span>}
      </Link>
    </th>
  );
}

function EmptyState() {
  return (
    <div className="bp-corners rounded-sm border border-dashed border-bp-line bg-bp-panel/60 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">No items yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-bp-muted">Add your first pair or piece. Track cost, asking price, and profit when it sells.</p>
      <Link href="/items/new" className="mt-5 inline-block rounded-sm border border-bp-accent/70 bg-bp-accent/15 px-4 py-2 text-sm font-medium text-bp-accent hover:bg-bp-accent/25">
        + Add your first item
      </Link>
    </div>
  );
}
