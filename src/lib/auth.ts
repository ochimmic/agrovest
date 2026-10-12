// Real authentication backed by Lovable Cloud.
// Keeps the legacy local app-state in sync so existing screens keep working.

import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setState, reset, type Role, type KycStatus } from "@/lib/store";

export type AppRole = Role | "admin";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
  kyc: KycStatus;
};

export type AuthSnapshot = {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
};

const empty: AuthSnapshot = { loading: true, user: null, profile: null, roles: [] };
let snap: AuthSnapshot = empty;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(patch: Partial<AuthSnapshot>) {
  snap = { ...snap, ...patch };
  emit();
}

export function getAuth() {
  return snap;
}

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snap,
    () => empty,
  );
}

export function isAdmin(s: AuthSnapshot = snap) {
  return s.roles.includes("admin");
}

/** Primary non-admin role used by the app shell. */
export function primaryRole(s: AuthSnapshot = snap): Role {
  if (s.roles.includes("broker")) return "broker";
  return "investor";
}

async function loadProfile(user: User) {
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  const p = (profile ?? null) as Profile | null;

  set({ loading: false, user, profile: p, roles });

  // keep the legacy store in sync for existing screens
  setState({
    user: {
      name: p?.full_name || (user.email ?? "Member"),
      email: p?.email || (user.email ?? ""),
      country: p?.country || "Nigeria",
    },
    role: primaryRole({ ...snap, roles }),
    kyc: p?.kyc ?? "none",
  });
}

async function applySession(session: Session | null) {
  if (!session?.user) {
    set({ loading: false, user: null, profile: null, roles: [] });
    return;
  }
  await loadProfile(session.user);
}

let started = false;

export function initAuth() {
  if (started || typeof window === "undefined") return;
  started = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      set({ loading: false, user: null, profile: null, roles: [] });
      return;
    }
    // defer supabase calls out of the callback
    setTimeout(() => void applySession(session), 0);
  });

  void supabase.auth.getSession().then(({ data }) => applySession(data.session));
}

export async function refreshProfile() {
  const { data } = await supabase.auth.getUser();
  if (data.user) await loadProfile(data.user);
}

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  country: string;
  phone?: string;
  role: Role;
  ref?: string;
};

export async function signUpWithEmail(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/home`,
      data: {
        full_name: input.fullName,
        country: input.country,
        phone: input.phone ?? null,
        role: input.role,
        ref: input.ref ?? null,
      },
    },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
  reset();
  set({ loading: false, user: null, profile: null, roles: [] });
}

/** Friendly message for the sign-in / sign-up screens. */
export function authErrorMessage(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid login credentials/i.test(msg)) return "That email or password is not correct.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox.";
  if (/already registered|already exists/i.test(msg)) return "An account with that email already exists. Try signing in.";
  if (/password/i.test(msg) && /least/i.test(msg)) return "Your password needs at least 6 characters.";
  if (/weak|pwned/i.test(msg)) return "That password has appeared in a data breach. Please choose a stronger one.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please wait a minute and try again.";
  return msg;
}
