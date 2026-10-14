import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { pool } from "../db.js";

type Site = { id: number; name: string };
type Device = { id: number; name: string };
type Reading = { deviceId: number; value: number; recordedAt: Date };

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

export const sitesRouter = Router();

sitesRouter.get("/:id/summary", async (req, res) => {
  const { id } = paramsSchema.parse(req.params);

  const {
    rows: [site],
  } = await pool.query<Site>("SELECT id, name FROM sites WHERE id = $1", [id]);
  if (!site) throw createHttpError(404, `Site ${id} not found`);

  const { rows: devices } = await pool.query<Device>(
    "SELECT id, name FROM devices WHERE site_id = $1 ORDER BY id",
    [id],
  );
  const { rows: readings } = await pool.query<Reading>(
    `SELECT r.device_id AS "deviceId", r.value, r.recorded_at AS "recordedAt"
     FROM readings r
     JOIN devices d ON d.id = r.device_id
     WHERE d.site_id = $1`,
    [id],
  );

  const readingsByDevice = readings.reduce<Record<number, Reading[]>>(
    (groups, reading) => ({
      ...groups,
      [reading.deviceId]: [...(groups[reading.deviceId] ?? []), reading],
    }),
    {},
  );

  res.json({
    site,
    devices: devices.map((device) => ({
      ...device,
      ...summarize(readingsByDevice[device.id] ?? []),
    })),
  });
});

function summarize(readings: Reading[]) {
  let min: number | null = null;
  let max: number | null = null;
  let latest: Reading | null = null;

  for (const reading of readings) {
    if (min === null || reading.value < min) min = reading.value;
    if (max === null || reading.value > max) max = reading.value;
    if (latest === null || reading.recordedAt > latest.recordedAt) latest = reading;
  }

  return {
    count: readings.length,
    min,
    max,
    latest: latest && { value: latest.value, recordedAt: latest.recordedAt },
  };
}
