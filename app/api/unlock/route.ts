import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "paradis_clearance";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  const expected = process.env.DOWNLOAD_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "DOWNLOAD_PASSWORD nao configurada no servidor" },
      { status: 500 }
    );
  }

  const submitted = (password ?? "").trim().toLowerCase();
  if (submitted !== expected.trim().toLowerCase()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
