import ItemForm from "@/components/ItemForm";
import { createItemAction } from "@/app/actions";
import { distinctBrands, distinctValues, getItem, type Item } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  // "Duplicate" support: copy the product details, but not the size or any sale info.
  let initial: Partial<Item> | undefined;
  const source = from ? getItem(Number(from)) : undefined;
  if (source) {
    initial = {
      category: source.category,
      brand: source.brand,
      name: source.name,
      colorway: source.colorway,
      sku: source.sku,
      size_system: source.size_system,
      condition: source.condition,
      purchase_price: source.purchase_price,
      purchase_date: source.purchase_date,
      purchase_source: source.purchase_source,
      list_price: source.list_price,
      location: source.location,
    };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">{source ? "Duplicate item" : "Add item"}</h1>
      <p className="mb-6 text-sm text-bp-muted">
        {source ? `Copied from ${source.brand} ${source.name}. Pick the new size and save.` : "Add a pair or piece to your inventory."}
      </p>
      <ItemForm
        mode="create"
        action={createItemAction}
        initial={initial}
        brands={distinctBrands()}
        sources={distinctValues("purchase_source")}
        locations={distinctValues("location")}
      />
    </div>
  );
}
