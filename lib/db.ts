/**
 * lib/db.ts
 * SQLite profile store using better-sqlite3.
 * DB file lives at: <project-root>/data/yojana.db  (auto-created on first run)
 */

import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "crypto";

const DB_DIR  = join(process.cwd(), "data");
const DB_PATH = join(DB_DIR, "yojana.db");

// Ensure /data folder exists
mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL for better concurrent read performance
db.pragma("journal_mode = WAL");

// ─── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id                 TEXT PRIMARY KEY DEFAULT 'default',
    name               TEXT NOT NULL DEFAULT '',
    age                INTEGER NOT NULL DEFAULT 30,
    gender             TEXT NOT NULL DEFAULT 'Male',
    state              TEXT NOT NULL DEFAULT '',
    occupation         TEXT NOT NULL DEFAULT '',
    income             INTEGER NOT NULL DEFAULT 0,
    category           TEXT NOT NULL DEFAULT 'General',
    bpl                INTEGER NOT NULL DEFAULT 0,
    has_land           INTEGER NOT NULL DEFAULT 0,
    disabled           INTEGER NOT NULL DEFAULT 0,
    marital_status     TEXT DEFAULT 'Single',
    children_count     INTEGER DEFAULT 0,
    education          TEXT DEFAULT 'Secondary',
    farmer_type        TEXT DEFAULT '',
    annual_ration_card INTEGER DEFAULT 0,
    is_student         INTEGER DEFAULT 0,
    is_senior          INTEGER DEFAULT 0,
    details            TEXT DEFAULT '{}',
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Migration: Add new columns if they don't exist (idempotent)
  PRAGMA table_info(profiles);
`);

// ─── Auth Schema (Users) ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add new columns safely if they don't exist
try {
  const existingCols = db.prepare("PRAGMA table_info(profiles)").all();
  const colNames = (existingCols as any[]).map((c: any) => c.name);
  const newCols = [
    { name: "marital_status", sql: "ALTER TABLE profiles ADD COLUMN marital_status TEXT DEFAULT 'Single'" },
    { name: "children_count", sql: "ALTER TABLE profiles ADD COLUMN children_count INTEGER DEFAULT 0" },
    { name: "education", sql: "ALTER TABLE profiles ADD COLUMN education TEXT DEFAULT 'Secondary'" },
    { name: "farmer_type", sql: "ALTER TABLE profiles ADD COLUMN farmer_type TEXT DEFAULT ''" },
    { name: "annual_ration_card", sql: "ALTER TABLE profiles ADD COLUMN annual_ration_card INTEGER DEFAULT 0" },
    { name: "is_student", sql: "ALTER TABLE profiles ADD COLUMN is_student INTEGER DEFAULT 0" },
    { name: "is_senior", sql: "ALTER TABLE profiles ADD COLUMN is_senior INTEGER DEFAULT 0" },
    { name: "details", sql: "ALTER TABLE profiles ADD COLUMN details TEXT DEFAULT '{}'" },
  ];
  for (const col of newCols) {
    if (!colNames.includes(col.name)) {
      try {
        db.exec(col.sql);
      } catch (e) {
        // Column might exist already, ignore
      }
    }
  }
} catch (e) {
  // Ignore schema migration errors
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProfileRow {
  id                 : string;
  name               : string;
  age                : number;
  gender             : string;
  state              : string;
  occupation         : string;
  income             : number;
  category           : string;
  bpl                : number;
  has_land           : number;
  disabled           : number;
  marital_status     : string;
  children_count     : number;
  education          : string;
  farmer_type        : string;
  annual_ration_card : number;
  is_student         : number;
  is_senior          : number;
  details            : string;
  created_at         : string;
  updated_at         : string;
}

export interface ProfileData {
  name               : string;
  age                : number;
  gender             : string;
  state              : string;
  occupation         : string;
  income             : number;
  category           : string;
  bpl                : boolean;
  has_land           : boolean;
  disabled           : boolean;
  marital_status?    : string;
  children_count?    : number;
  education?         : string;
  farmer_type?       : string;
  annual_ration_card?: boolean;
  is_student?        : boolean;
  is_senior?         : boolean;
  details?           : Record<string, unknown>;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const stmtGet = db.prepare<[string], ProfileRow>(
  `SELECT * FROM profiles WHERE id = ? LIMIT 1`
);

const stmtUpsert = db.prepare<[
  string, string, number, string, string, string, number, string, number, number, number,
  string, number, string, string, number, number, number, string
]>(`
  INSERT INTO profiles 
    (id, name, age, gender, state, occupation, income, category, bpl, has_land, disabled, 
     marital_status, children_count, education, farmer_type, annual_ration_card, is_student, is_senior, details, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    name               = excluded.name,
    age                = excluded.age,
    gender             = excluded.gender,
    state              = excluded.state,
    occupation         = excluded.occupation,
    income             = excluded.income,
    category           = excluded.category,
    bpl                = excluded.bpl,
    has_land           = excluded.has_land,
    disabled           = excluded.disabled,
    marital_status     = excluded.marital_status,
    children_count     = excluded.children_count,
    education          = excluded.education,
    farmer_type        = excluded.farmer_type,
    annual_ration_card = excluded.annual_ration_card,
    is_student         = excluded.is_student,
    is_senior          = excluded.is_senior,
    details            = excluded.details,
    updated_at         = datetime('now')
`);

const stmtDelete = db.prepare<[string]>(`DELETE FROM profiles WHERE id = ?`);

// ─── Exported helpers ─────────────────────────────────────────────────────────

/** Returns the saved profile or null if none exists */
export function getProfile(userId: string = "default"): ProfileData | null {
  const row = stmtGet.get(userId) as ProfileRow | undefined;
  if (!row) return null;
  return {
    name:               row.name,
    age:                row.age,
    gender:             row.gender,
    state:              row.state,
    occupation:         row.occupation,
    income:             row.income,
    category:           row.category,
    bpl:                row.bpl === 1,
    has_land:           row.has_land === 1,
    disabled:           row.disabled === 1,
    marital_status:     row.marital_status,
    children_count:     row.children_count,
    education:          row.education,
    farmer_type:        row.farmer_type,
    annual_ration_card: row.annual_ration_card === 1,
    is_student:         row.is_student === 1,
    is_senior:          row.is_senior === 1,
    details:            row.details ? JSON.parse(row.details) : {},
  };
}

/** Upserts the profile (insert or update) */
export function saveProfile(p: ProfileData, userId: string = "default"): void {
  const details = JSON.stringify(p.details || {});
  stmtUpsert.run(
    userId,
    p.name,
    p.age,
    p.gender,
    p.state,
    p.occupation,
    p.income,
    p.category,
    p.bpl           ? 1 : 0,
    p.has_land      ? 1 : 0,
    p.disabled      ? 1 : 0,
    p.marital_status || "Single",
    p.children_count || 0,
    p.education || "Secondary",
    p.farmer_type || "",
    p.annual_ration_card ? 1 : 0,
    p.is_student ? 1 : 0,
    p.is_senior ? 1 : 0,
    details,
  );
}

/** Deletes the saved profile */
export function deleteProfile(userId: string = "default"): void {
  stmtDelete.run(userId);
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
}

const stmtCreateUser = db.prepare<[string, string, string, string, string]>(
  `INSERT INTO users (id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`
);

const stmtGetUserByEmail = db.prepare<[string], UserRow>(
  `SELECT * FROM users WHERE email = ? LIMIT 1`
);

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(":");
    const derivedKey = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

export function createUser(name: string, email: string, phone: string, passwordRaw: string): UserRow {
  const existing = stmtGetUserByEmail.get(email);
  if (existing) {
    throw new Error("Email already registered");
  }

  const id = randomUUID();
  const passHash = hashPassword(passwordRaw);
  
  stmtCreateUser.run(id, name, email, phone, passHash);
  
  return { id, name, email, phone, password_hash: passHash };
}

export function authenticateUser(email: string, passwordRaw: string): UserRow | null {
  const user = stmtGetUserByEmail.get(email);
  if (!user) return null;
  if (!verifyPassword(passwordRaw, user.password_hash)) return null;
  return user;
}

export default db;
