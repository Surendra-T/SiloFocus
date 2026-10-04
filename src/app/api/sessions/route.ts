import { NextRequest, NextResponse } from "next/server";
import { validateCheckIn } from "../../../lib/db/models";
import { getSessionsCollection } from "../../../lib/db/client";
import { computeSessionStats } from "../../../lib/db/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateCheckIn(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  try {
    const coll = await getSessionsCollection();
    const res = await coll.insertOne({ ...validation.data, completedAt: new Date() });
    return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
  } catch (err) {
    console.error("[sessions:POST]", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const tzParam = Number(req.nextUrl.searchParams.get("tz"));
  const tzOffsetMinutes = Number.isFinite(tzParam) && Math.abs(tzParam) <= 840 ? tzParam : 0;
  try {
    const coll = await getSessionsCollection();
    const sessions = await coll.find().sort({ completedAt: -1 }).limit(1000).toArray();
    return NextResponse.json(computeSessionStats(sessions, tzOffsetMinutes));
  } catch (err) {
    console.error("[sessions:GET]", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
