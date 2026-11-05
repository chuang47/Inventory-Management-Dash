import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "inventory.db");

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH, { timeout: 5000 });
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      category        TEXT    NOT NULL,
      brand           TEXT    NOT NULL,
      name            TEXT    NOT NULL,
      colorway        TEXT,
      sku             TEXT,
      size_system     TEXT    NOT NULL,
      size            TEXT    NOT NULL,
      condition       TEXT    NOT NULL DEFAULT 'dswt',
      status          TEXT    NOT NULL DEFAULT 'in_stock',
      purchase_price  REAL,
      purchase_date   TEXT,
      purchase_source TEXT,
      list_price      REAL,
      listed_on       TEXT,
      sold_price      REAL,
      sold_date       TEXT,
      sold_platform   TEXT,
      fees            REAL,
      shipping_cost   REAL,
      location        TEXT,
      notes           TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_brand  ON items(brand);
  `);
  return db;
}

// Open lazily (not at import time) and reuse one connection across hot reloads in dev.
const g = globalThis as unknown as { __inventoryDb?: Database.Database };
export function getDb() {
  return (g.__inventoryDb ??= open());
}
