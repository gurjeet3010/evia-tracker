// Simple local-storage auth + user data persistence (client-only)
import type { UserData } from "./cycle";

const AUTH_KEY = "bloom.auth";
const USERS_KEY = "bloom.users";
const DATA_KEY = "bloom.userdata";

type StoredUser = { email: string; password: string };

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getCurrentEmail(): string | null {
  return safeStorage()?.getItem(AUTH_KEY) ?? null;
}

function readUsers(): StoredUser[] {
  const raw = safeStorage()?.getItem(USERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as StoredUser[]; } catch { return []; }
}

function writeUsers(users: StoredUser[]) {
  safeStorage()?.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUp(email: string, password: string): { ok: boolean; error?: string } {
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  users.push({ email, password });
  writeUsers(users);
  safeStorage()?.setItem(AUTH_KEY, email);
  return { ok: true };
}

export function signIn(email: string, password: string): { ok: boolean; error?: string } {
  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }
  safeStorage()?.setItem(AUTH_KEY, email);
  return { ok: true };
}

export function signOut() {
  safeStorage()?.removeItem(AUTH_KEY);
}

export function getUserData(): UserData | null {
  const email = getCurrentEmail();
  if (!email) return null;
  const raw = safeStorage()?.getItem(`${DATA_KEY}:${email}`);
  if (!raw) {
    // Default seed
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return {
      email,
      lastPeriodDate: today.toISOString().slice(0, 10),
      cycleLength: 28,
      periodLength: 5,
    };
  }
  try { return JSON.parse(raw) as UserData; } catch { return null; }
}

export function saveUserData(data: UserData) {
  safeStorage()?.setItem(`${DATA_KEY}:${data.email}`, JSON.stringify(data));
}
