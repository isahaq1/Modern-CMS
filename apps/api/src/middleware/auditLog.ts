import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma.js";

// Paths whose mutations aren't editorial actions worth auditing: public form
// submissions (spam volume) and the auth endpoints' own bodies (logins ARE logged,
// via the response hook below, but never their credentials — we only record the URL).
const SKIP_PREFIXES = ["/api/forms/submit"];

/** Records every successful mutating API call (who, what URL, when) after the
 * response finishes. Middleware-based so new routes are audited automatically instead
 * of relying on every future handler remembering to log. Failures to write the log
 * never affect the request itself. */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  const mutating = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
  if (!mutating || SKIP_PREFIXES.some((p) => req.path.startsWith(p))) return next();

  res.on("finish", () => {
    if (res.statusCode >= 400) return; // only record actions that actually happened
    void prisma.auditLog
      .create({
        data: {
          userId: req.user?.sub ?? null,
          userEmail: req.user?.email ?? null,
          action: `${req.method} ${req.path.split("/").slice(0, 4).join("/")}`,
          entityPath: req.originalUrl.slice(0, 500),
          status: res.statusCode,
        },
      })
      .catch((err) => console.warn("audit log write failed:", err));
  });
  next();
}
