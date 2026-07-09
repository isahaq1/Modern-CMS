import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@pgcms/shared";
import { env } from "../env.js";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

/** ADMIN/EDITOR can touch any resource, exactly as before AUTHOR existed. An AUTHOR can
 * only touch a resource they created — used inline in mutation routes (after the
 * resource is fetched) rather than as router middleware, since ownership can't be
 * checked before the row exists. `createdById` is nullable (pre-AUTHOR rows, or rows an
 * ADMIN created on someone's behalf), and null never matches an AUTHOR's own id. */
export function canModify(user: AuthTokenPayload, resource: { createdById?: string | null }): boolean {
  if (user.role !== "AUTHOR") return true;
  return resource.createdById === user.sub;
}
