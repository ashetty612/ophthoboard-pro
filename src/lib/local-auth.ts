"use client";

/**
 * Local-first account system.
 *
 * Provides sign-up + sign-in that work TODAY (no cloud required), using the
 * browser's SubtleCrypto for real PBKDF2 password hashing. Each account is
 * isolated per device; progress (attempts, bookmarks, SRS) is scoped by the
 * active user so multiple people can share a device.
 *
 * When Supabase env vars are added later, the top-level auth context will
 * prefer cloud auth automatically — this layer is a graceful fallback.
 *
 * Security posture:
 *  - This is NOT a server-authenticated system. It gates the in-app
 *    experience but cannot enforce secrets server-side.
 *  - Passwords are hashed with PBKDF2-SHA-256 (120,000 iterations) + a
 *    per-user random 16-byte salt. Raw passwords are never persisted.
 *  - Usernames are the primary key (case-insensitive).
 *  - Designed for beta: closed-allowlist enforced on sign-up.
 */

const USERS_KEY = "cvb.localAuth.users.v1";
const SESSION_KEY = "cvb.localAuth.session.v1";
const ALLOWLIST_KEY = "cvb.localAuth.allowlist.v1";

// Seeded with the owner's email. Can be modified in-browser via
// addToAllowlist() from the settings page once signed in as owner.
const DEFAULT_ALLOWLIST = [
  "ashetty612@gmail.com",
];

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  saltHex: string;
  hashHex: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  startedAt: string;
}

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

// ────────────────────────────────────────────────────────────────────────
// Helpers

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password: string, saltHex: string, iterations = 120_000): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Browser crypto not available.");
  }
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

function randomHex(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

// ────────────────────────────────────────────────────────────────────────
// Allowlist

export function readAllowlist(): string[] {
  if (typeof window === "undefined") return DEFAULT_ALLOWLIST;
  try {
    const raw = window.localStorage.getItem(ALLOWLIST_KEY);
    if (!raw) return DEFAULT_ALLOWLIST;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((e) => normalizeEmail(String(e)));
  } catch {
    /* noop */
  }
  return DEFAULT_ALLOWLIST;
}

export function addToAllowlist(email: string): void {
  if (typeof window === "undefined") return;
  const list = readAllowlist();
  const e = normalizeEmail(email);
  if (!list.includes(e)) {
    list.push(e);
    window.localStorage.setItem(ALLOWLIST_KEY, JSON.stringify(list));
  }
}

export function isAllowlisted(email: string): boolean {
  const list = readAllowlist();
  return list.includes(normalizeEmail(email));
}

// ────────────────────────────────────────────────────────────────────────
// Sign-up / sign-in / sign-out

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!password || password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (!isAllowlisted(e)) {
    return {
      ok: false,
      error:
        "This email isn't on the closed-beta list yet. Email beta@clearvisioneducation.app for access.",
    };
  }
  const users = readUsers();
  if (users.some((u) => normalizeEmail(u.email) === e)) {
    return { ok: false, error: "An account with that email already exists. Try signing in." };
  }
  const saltHex = randomHex(16);
  const hashHex = await pbkdf2(password, saltHex);
  const user: StoredUser = {
    id: randomHex(12),
    email: e,
    displayName: (displayName || e.split("@")[0]).slice(0, 60),
    saltHex,
    hashHex,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  const session = makeSession(user);
  writeSession(session);
  return { ok: true, session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const e = normalizeEmail(email);
  const users = readUsers();
  const user = users.find((u) => normalizeEmail(u.email) === e);
  if (!user) return { ok: false, error: "No local account found. Sign up first." };
  const testHash = await pbkdf2(password, user.saltHex);
  if (testHash !== user.hashHex) {
    return { ok: false, error: "Wrong password." };
  }
  const session = makeSession(user);
  writeSession(session);
  return { ok: true, session };
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

// ────────────────────────────────────────────────────────────────────────
// Session helpers

function makeSession(u: StoredUser): Session {
  return {
    userId: u.id,
    email: u.email,
    displayName: u.displayName,
    startedAt: new Date().toISOString(),
  };
}

function writeSession(s: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function updateDisplayName(name: string): void {
  const s = getSession();
  if (!s) return;
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === s.userId);
  if (idx < 0) return;
  users[idx].displayName = name.slice(0, 60);
  writeUsers(users);
  writeSession({ ...s, displayName: users[idx].displayName });
}

export function changePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
  const s = getSession();
  if (!s) return Promise.resolve({ ok: false, error: "Not signed in." });
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === s.userId);
  if (idx < 0) return Promise.resolve({ ok: false, error: "Account not found." });
  return pbkdf2(oldPassword, users[idx].saltHex).then(async (testHash) => {
    if (testHash !== users[idx].hashHex) {
      return { ok: false, error: "Current password incorrect." };
    }
    if (newPassword.length < 8) {
      return { ok: false, error: "New password must be at least 8 characters." };
    }
    const saltHex = randomHex(16);
    const hashHex = await pbkdf2(newPassword, saltHex);
    users[idx].saltHex = saltHex;
    users[idx].hashHex = hashHex;
    writeUsers(users);
    return { ok: true, session: getSession()! };
  });
}
