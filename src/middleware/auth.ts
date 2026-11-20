import type { NextFunction, Request, RequestHandler, Response } from "express";
import { jwtVerify } from "jose";

type Role = "customer" | "owner" | "admin";

const jwtSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "");

/** Verifies the JWT issued by the Next.js app after a better-auth login. */
export const verifyToken: RequestHandler = async (req, res, next) => {
  const header = req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    res.locals.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const requireRole = (...allowed: Role[]): RequestHandler => (_req, res, next) => {
  const role = (res.locals.user as { role?: string } | undefined)?.role;

  if (!role || !allowed.includes(role as Role)) {
    res.status(403).json({ success: false, message: "Access denied for this role" });
    return;
  }

  next();
};

export const verifyRenter: RequestHandler[] = [
  verifyToken,
  requireRole("customer"),
];
export const verifyOwner: RequestHandler[] = [
  verifyToken,
  requireRole("owner"),
];
export const verifyAdmin: RequestHandler[] = [
  verifyToken,
  requireRole("admin"),
];
