"use client";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this item? This can't be undone.")) e.preventDefault();
      }}
    >
      <button type="submit" className="rounded-sm border border-red-400/30 bg-bp-panel px-3 py-1.5 text-sm text-red-300 hover:bg-red-400/10">
        Delete
      </button>
    </form>
  );
}
