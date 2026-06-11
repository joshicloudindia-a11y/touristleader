import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { grantsAdminAccess } from "./rbac";
import { resolveRole, SUPER_ADMIN_RESOLVED } from "./roles";

const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
const COOKIE = "tl_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ---- Email OTP (stateless: OTP hash carried in a short-lived signed token) ----
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits
}
function hashOtp(email: string, otp: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${email.toLowerCase()}:${otp}`).digest("hex");
}
export function signOtpToken(email: string, otp: string): string {
  return jwt.sign({ email: email.toLowerCase(), otpHash: hashOtp(email, otp) }, SECRET, { expiresIn: "10m" });
}
export function verifyOtpToken(token: string, email: string, otp: string): boolean {
  try {
    const decoded = jwt.verify(token, SECRET) as { email: string; otpHash: string };
    if (decoded.email !== email.toLowerCase()) return false;
    const expected = hashOtp(email, otp);
    return crypto.timingSafeEqual(Buffer.from(decoded.otpHash), Buffer.from(expected));
  } catch {
    return false;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signToken(userId: string) {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { uid: string };
    return decoded.uid;
  } catch {
    return null;
  }
}

/** Set the session cookie (call from a route handler). */
export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(COOKIE, signToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Resolve the currently logged-in user from the session cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const uid = verifyToken(token);
    if (!uid) return null;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, name: true, phone: true },
    });
    return user;
  } catch {
    return null;
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Resolve the current user's RBAC role, permissions and admin status (DB-backed). */
export async function isAdmin(): Promise<{ ok: boolean; role: string; roleName: string; permissions: string[]; user: SessionUser | null }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, role: "USER", roleName: "User", permissions: [], user: null };
  if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return { ok: true, role: SUPER_ADMIN_RESOLVED.key, roleName: SUPER_ADMIN_RESOLVED.name, permissions: SUPER_ADMIN_RESOLVED.permissions, user };
  }
  try {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    const resolved = await resolveRole(u?.role || "USER");
    return { ok: grantsAdminAccess(resolved.permissions), role: resolved.key, roleName: resolved.name, permissions: resolved.permissions, user };
  } catch {
    return { ok: false, role: "USER", roleName: "User", permissions: [], user };
  }
}

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Is this account a staff member (admin/agent/any role with admin access)? */
export async function isStaffUser(email: string, roleKey: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  const resolved = await resolveRole(roleKey || "USER");
  return grantsAdminAccess(resolved.permissions);
}
