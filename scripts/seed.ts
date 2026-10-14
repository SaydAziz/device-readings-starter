import { pool } from "../src/db.js";

const SITE_NAMES = ["North Plant", "South Plant", "Harbor Depot"];
const DEVICE_COUNT = 20;
const READING_COUNT = 50_000;
const BATCH_SIZE = 5_000;
const WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

await pool.query("TRUNCATE sites, devices, readings RESTART IDENTITY CASCADE");

const { rows: sites } = await pool.query<{ id: number }>(
  "INSERT INTO sites (name) SELECT unnest($1::text[]) RETURNING id",
  [SITE_NAMES],
);

const deviceSiteIds = Array.from({ length: DEVICE_COUNT }, (_, i) => sites[i % sites.length].id);
const deviceNames = deviceSiteIds.map((_, i) => `Sensor ${String(i + 1).padStart(2, "0")}`);
const { rows: devices } = await pool.query<{ id: number }>(
  "INSERT INTO devices (site_id, name) SELECT * FROM unnest($1::int[], $2::text[]) RETURNING id",
  [deviceSiteIds, deviceNames],
);

const now = Date.now();
for (let offset = 0; offset < READING_COUNT; offset += BATCH_SIZE) {
  const size = Math.min(BATCH_SIZE, READING_COUNT - offset);
  const deviceIds = Array.from({ length: size }, () => devices[Math.floor(Math.random() * devices.length)].id);
  const values = Array.from({ length: size }, () => Math.round(Math.random() * 1000) / 10);
  const recordedAts = Array.from({ length: size }, () => new Date(now - Math.random() * WINDOW_MS));

  await pool.query(
    `INSERT INTO readings (device_id, value, recorded_at)
     SELECT * FROM unnest($1::int[], $2::numeric[], $3::timestamptz[])`,
    [deviceIds, values, recordedAts],
  );
}

console.log(`Seeded ${sites.length} sites, ${devices.length} devices, ${READING_COUNT} readings`);
await pool.end();
