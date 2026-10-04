import { MongoClient } from "mongodb";
import { StudySession, COLLECTIONS, Subject } from "../src/lib/db/models";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "silofocus";

const today = new Date();
today.setHours(12, 0, 0, 0);

function daysAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
}

const mockData: Omit<StudySession, "_id">[] = [
  { subject: "Chemistry", durationMinutes: 25, completedAt: daysAgo(29), moodScore: 3, productivityScore: 4, notes: "SN1/SN2 mechanisms... still confusing." },
  { subject: "Chemistry", durationMinutes: 25, completedAt: daysAgo(29), moodScore: 5, productivityScore: 6, notes: "Put on lo-fi, took a walk, finally cracked aldol condensation" },
  { subject: "Physics", durationMinutes: 50, completedAt: daysAgo(25), moodScore: 8, productivityScore: 9, notes: "Electrostatics derivations done." },
  { subject: "Mathematics", durationMinutes: 25, completedAt: daysAgo(20), moodScore: 9, productivityScore: 9, notes: "Definite integrals." },
  { subject: "Mathematics", durationMinutes: 50, completedAt: daysAgo(15), moodScore: 7, productivityScore: 8, notes: "Differential equations. Solid progress." },
  { subject: "Physics", durationMinutes: 25, completedAt: daysAgo(8), moodScore: 4, productivityScore: 5, notes: "Ray optics." },
  { subject: "Chemistry", durationMinutes: 25, completedAt: daysAgo(3), moodScore: 8, productivityScore: 8, notes: "Naming reactions memorized." },
  { subject: "Physics", durationMinutes: 50, completedAt: daysAgo(2), moodScore: 7, productivityScore: 7, notes: "EMI practice." },
  { subject: "Mathematics", durationMinutes: 25, completedAt: daysAgo(1), moodScore: 9, productivityScore: 9, notes: "Calculus mock test 1." },
  { subject: "Chemistry", durationMinutes: 25, completedAt: new Date(), moodScore: 8, productivityScore: 9, notes: "Organic rev." }
];

async function seed() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection(COLLECTIONS.sessions);
    
    if (process.argv.includes("--reset") || true) {
      await coll.deleteMany({});
      console.log("Cleared existing sessions.");
    }
    
    await coll.insertMany(mockData as any[]);
    console.log(`Seeded ${mockData.length} sessions.`);
  } finally {
    await client.close();
  }
}
seed().catch(console.error);
