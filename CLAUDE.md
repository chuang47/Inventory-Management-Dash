# Inventory Management Dash

Local-only resale inventory tracker for shoes and clothing. Next.js 15 (App Router) + TypeScript + Tailwind v4 + SQLite (better-sqlite3).

## Run
- `npm run dev` → http://localhost:3000
- `npm run lint` / `npx tsc --noEmit`
- The user often has `npm run dev` running. **Don't run a plain `next build`**, because it overwrites `.next` and breaks their dev server. To verify a build, use `NEXT_DIST_DIR=.next-preview npx next build` (and `next start` with the same env on another port).

## Data
- DB file: `data/inventory.db` (gitignored, created on first request). Back up by copying this file.
- Schema is created in `src/lib/db.ts` (`CREATE TABLE IF NOT EXISTS`); there is no migration tool yet, so new columns need an `ALTER TABLE` guard there.
- **One row = one physical unit.** "Quantity" on the add form inserts N rows so each unit has its own cost/sale. Don't add a quantity column.
- Profit = sold_price − purchase_price − fees − shipping_cost (`profitOf` in `src/lib/items.ts`, mirrored in SQL in `getStats`/sort).
- Status: `in_stock` | `listed` | `sold`. Sale fields are cleared unless status is `sold`.

## Layout
- `src/lib/constants.ts`: categories, size systems per category, size suggestions, conditions, platforms (client-safe)
- `src/lib/items.ts`: all queries (server-only)
- `src/app/actions.ts`: server actions + form validation
- `src/app/page.tsx`: dashboard (stats, filterable/sortable table, brand/category breakdown). Filters live in URL search params.
- `src/components/ItemForm.tsx`: shared add/edit form. It submits via `startTransition` instead of `<form action>` so React 19 doesn't reset fields on validation errors.

## Design
Dark "blueprint" theme: slate-grey background with a drafting grid, pale-blue hairlines, cyan accent, square corners. One typeface everywhere: Geist Mono (`--font-sans` is aliased to it in globals.css, so don't add a second font). Labels are small uppercase with wide letter-spacing. The colour tokens are `bp-*` in `src/app/globals.css` (use those, not zinc/white). Add `bp-corners` to a panel to give it corner registration marks.

## Planned / not built yet
- CSV/Excel import with column mapping (SheetJS/PapaParse), CSV export, photos
