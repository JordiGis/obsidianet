import { NextRequest, NextResponse } from "next/server";
import { getAttachmentPath } from "@/lib/queries";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const ROOT = process.env.STORAGE_PATH || "/docmost-storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await getAttachmentPath(params.id);
  if (!a) return new NextResponse("not found", { status: 404 });

  // resolve safely inside ROOT (file_path may be absolute-ish or relative)
  const rel = a.file_path.replace(/^\/+/, "");
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(path.resolve(ROOT))) {
    return new NextResponse("forbidden", { status: 403 });
  }
  try {
    const data = await fs.readFile(full);
    return new NextResponse(data, {
      headers: {
        "Content-Type": a.mime_type || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse("unavailable", { status: 404 });
  }
}
