import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { authRouter } from "./routes/auth.routes.js";
import { pagesRouter } from "./routes/pages.routes.js";
import { mediaRouter } from "./routes/media.routes.js";
import { themeRouter } from "./routes/theme.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { formsRouter } from "./routes/forms.routes.js";
import { globalSectionsRouter } from "./routes/globalSections.routes.js";
import { blocksRouter } from "./routes/blocks.routes.js";
import { collectionsRouter } from "./routes/collections.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { redirectsRouter } from "./routes/redirects.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { templatesRouter } from "./routes/templates.routes.js";
import { backupRouter } from "./routes/backup.routes.js";
import { auditLog } from "./middleware/auditLog.js";

const app = express();

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Registered before the routers, but it records on response-finish — by then the
// router's own requireAuth has attached req.user, so entries carry who did it.
app.use(auditLog);

app.use("/api/auth", authRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/media", mediaRouter);
app.use("/api/theme", themeRouter);
app.use("/api/users", usersRouter);
app.use("/api/forms", formsRouter);
app.use("/api/global-sections", globalSectionsRouter);
app.use("/api/blocks", blocksRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/search", searchRouter);
app.use("/api/redirects", redirectsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/backup", backupRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`pg-cms API listening on http://localhost:${env.port}`);
});
