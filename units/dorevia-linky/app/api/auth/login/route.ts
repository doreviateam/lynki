import { NextRequest, NextResponse } from "next/server";
import {
  resolveRoleFromToken,
  encodeSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/app/lib/auth-roles";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Sprint 06 T32
// Body : { token: string }
// Crée un cookie de session httpOnly avec le rôle associé au token.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let token = "";
  try {
    const body = await req.json() as { token?: string };
    token = (body.token ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "token requis" }, { status: 400 });
  }

  const role = resolveRoleFromToken(token);
  if (!role) {
    return NextResponse.json({ error: "Token non reconnu" }, { status: 401 });
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const sessionValue = encodeSession({ role, expiresAt });

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
    // secure: true en production (HTTPS)
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
