import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "dev-secret");
export const COOKIE = "admin_session";

export async function signSession(username: string): Promise<string> {
  return new SignJWT({ sub: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function checkCredentials(user: string, pass: string): boolean {
  const U = process.env.ADMIN_USER || "";
  const P = process.env.ADMIN_PASSWORD || "";
  // constant-ish time compare
  return user === U && pass === P && P.length > 0;
}
