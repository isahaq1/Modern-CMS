import { ApiError } from "./api";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Server-side client: calls the Express API directly (server-to-server), used only
// for public/unauthenticated data during SSR of the public site.
export async function serverGet<T>(path: string, options?: { tags?: string[]; revalidate?: number }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: {
      tags: options?.tags ?? ["cms"],
      revalidate: options?.revalidate ?? 60,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ? (typeof body.error === "string" ? body.error : JSON.stringify(body.error)) : message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}
