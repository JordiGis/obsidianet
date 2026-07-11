import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, signSession, COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!checkCredentials(username || "", password || "")) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }
  const token = await signSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
