import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/** Called by the Express API after publish/save to bust ISR cache tags. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Revalidation not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
    return NextResponse.json({ error: "tags must be a string array" }, { status: 400 });
  }

  for (const tag of body.tags) {
    // Next 16 requires a cache-life profile; "max" expires the tag everywhere
    // immediately, matching the pre-16 single-argument behavior.
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: true, tags: body.tags });
}
