import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export type TokenPayload = {
  sub: string;
  role: "ADMIN" | "EMPLOYEE";
  type: "access" | "refresh";
};

function getAccessSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is not set");
  return s;
}

export function signAccessToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign(
    { sub: payload.sub, role: payload.role, type: "access" },
    getAccessSecret(),
    { expiresIn: ACCESS_EXPIRY }
  );
}

export function signRefreshToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign(
    { sub: payload.sub, role: payload.role, type: "refresh" },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRY }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload &
    TokenPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload &
    TokenPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded as TokenPayload;
}
