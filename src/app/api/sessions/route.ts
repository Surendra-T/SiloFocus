import { NextRequest, NextResponse } from "next/server";
import { validateCheckIn, SessionStats, Subject } from "../../../lib/db/models";
import { getSessionsCollection, getDb } from "../../../lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const val = validateCheckIn(body);
    if (!val.ok) {
      return NextResponse.json({ error: val.error }, { status: 400 });
    }
    
    const coll = await getSessionsCollection();
    const res = await coll.insertOne({
      ...val.data,
      completedAt: new Date()
    });
    
    return NextResponse.json({ id: res.insertedId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const coll = await getSessionsCollection();
    const all = await coll.find().sort({ completedAt: -1 }).toArray();
    
    if (all.length === 0) {
      return NextResponse.json({
        totalHours: 0, totalSessions: 0, avgProductivity: 0, avgMood: 0, currentStreak: 0, longestStreak: 0, bySubject: {} as any, recent: []
      });
    }

    let totalHours = 0;
    let totalProd = 0;
    let totalMood = 0;
    const bySubj: Record<string, any> = {};

    for (const s of all) {
      totalHours += s.durationMinutes / 60;
      totalProd += s.productivityScore;
      totalMood += s.moodScore;
      if (!bySubj[s.subject]) {
        bySubj[s.subject] = { hours: 0, sessions: 0, totalProd: 0 };
      }
      bySubj[s.subject].hours += s.durationMinutes / 60;
      bySubj[s.subject].sessions++;
      bySubj[s.subject].totalProd += s.productivityScore;
    }
    
    for (const k of Object.keys(bySubj)) {
      bySubj[k].avgProductivity = bySubj[k].totalProd / bySubj[k].sessions;
      delete bySubj[k].totalProd;
    }

    let streak = 0;
    let lastDate = new Date();
    for (const s of all) {
        streak++; 
    }

    const stats: SessionStats = {
      totalHours,
      totalSessions: all.length,
      avgProductivity: totalProd / all.length,
      avgMood: totalMood / all.length,
      currentStreak: streak,
      longestStreak: streak,
      bySubject: bySubj as any,
      recent: all.slice(0, 5)
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 503 });
  }
}
