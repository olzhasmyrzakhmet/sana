// SANA — DDL (SPEC §3). Идемпотентно: CREATE TABLE IF NOT EXISTS.
// Аналитика и приложение в одной Turso-БД. Деньги в ₸ как INTEGER (без копеек).

export const ddlStatements = [
  // ---- Приложение ----
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('CEO','REGION','ANALYST')),
     scope_json TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS ask_history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER,
     pack TEXT NOT NULL,
     question TEXT NOT NULL,
     plan_json TEXT,
     sql_text TEXT,
     row_count INTEGER,
     duration_ms INTEGER,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER,
     action TEXT NOT NULL,
     meta_json TEXT,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS insights_cache (
     pack TEXT PRIMARY KEY,
     payload_json TEXT NOT NULL,
     computed_at TEXT NOT NULL
   )`,

  // ---- AUTO ----
  `CREATE TABLE IF NOT EXISTS dealers (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     city TEXT NOT NULL,
     region TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS models (
     id INTEGER PRIMARY KEY,
     brand TEXT NOT NULL,
     model TEXT NOT NULL,
     segment TEXT NOT NULL,
     price_class TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS auto_sales (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     d TEXT NOT NULL,
     dealer_id INTEGER NOT NULL,
     model_id INTEGER NOT NULL,
     qty INTEGER NOT NULL,
     revenue INTEGER NOT NULL,
     discount_pct REAL NOT NULL,
     channel TEXT NOT NULL,
     manager TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS auto_inventory (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     d TEXT NOT NULL,
     dealer_id INTEGER NOT NULL,
     model_id INTEGER NOT NULL,
     stock_qty INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS service_orders (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     d TEXT NOT NULL,
     dealer_id INTEGER NOT NULL,
     model_id INTEGER NOT NULL,
     type TEXT NOT NULL,
     revenue INTEGER NOT NULL,
     nps INTEGER NOT NULL
   )`,

  // ---- RETAIL ----
  `CREATE TABLE IF NOT EXISTS stores (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     city TEXT NOT NULL,
     region TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS categories (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS retail_sales (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     d TEXT NOT NULL,
     store_id INTEGER NOT NULL,
     category_id INTEGER NOT NULL,
     qty INTEGER NOT NULL,
     revenue INTEGER NOT NULL,
     returns_qty INTEGER NOT NULL
   )`,

  // ---- BANK ----
  `CREATE TABLE IF NOT EXISTS branches (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     city TEXT NOT NULL,
     region TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS bank_products (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     type TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS bank_facts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     d TEXT NOT NULL,
     branch_id INTEGER NOT NULL,
     product_id INTEGER NOT NULL,
     issued_amount INTEGER NOT NULL,
     balance INTEGER NOT NULL
   )`,

  // ---- Индексы (даты + FK) ----
  `CREATE INDEX IF NOT EXISTS idx_auto_sales_d ON auto_sales (d)`,
  `CREATE INDEX IF NOT EXISTS idx_auto_sales_dealer ON auto_sales (dealer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auto_sales_model ON auto_sales (model_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auto_inventory_d ON auto_inventory (d)`,
  `CREATE INDEX IF NOT EXISTS idx_service_orders_d ON service_orders (d)`,
  `CREATE INDEX IF NOT EXISTS idx_retail_sales_d ON retail_sales (d)`,
  `CREATE INDEX IF NOT EXISTS idx_retail_sales_store ON retail_sales (store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bank_facts_d ON bank_facts (d)`,
  `CREATE INDEX IF NOT EXISTS idx_bank_facts_branch ON bank_facts (branch_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ask_history_created ON ask_history (created_at)`,
];
