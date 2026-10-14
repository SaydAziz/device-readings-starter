import { pool } from "../src/db.js";

export async function createSite(name: string, deviceNames: string[]) {
  const {
    rows: [site],
  } = await pool.query<{ id: number }>("INSERT INTO sites (name) VALUES ($1) RETURNING id", [name]);
  const { rows: devices } = await pool.query<{ id: number }>(
    "INSERT INTO devices (site_id, name) SELECT $1, unnest($2::text[]) RETURNING id",
    [site.id, deviceNames],
  );
  return { siteId: site.id, deviceIds: devices.map((device) => device.id) };
}
