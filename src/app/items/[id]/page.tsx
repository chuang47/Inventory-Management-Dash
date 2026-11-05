import Link from "next/link";
import { notFound } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import DeleteButton from "@/components/DeleteButton";
import { deleteItemAction, updateItemAction } from "@/app/actions";
import { distinctBrands, distinctValues, getItem } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(Number(id));
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.brand} {item.name}</h1>
          <p className="text-sm text-bp-muted">
            {[item.colorway, item.sku, `${item.size_system} ${item.size}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/items/new?from=${item.id}`} className="rounded-sm border border-bp-line bg-bp-panel px-3 py-1.5 text-sm hover:border-bp-accent/60">
            Duplicate
          </Link>
          <DeleteButton action={deleteItemAction.bind(null, item.id)} />
        </div>
      </div>
      <ItemForm
        mode="edit"
        action={updateItemAction.bind(null, item.id)}
        initial={item}
        brands={distinctBrands()}
        sources={distinctValues("purchase_source")}
        locations={distinctValues("location")}
      />
    </div>
  );
}
