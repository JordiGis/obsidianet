import { NextRequest, NextResponse } from "next/server";
import { createUser, listUsers } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listUsers());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, role } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }
  try {
    const r = await createUser({ name, email, password, role });
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 400 });
  }
}
