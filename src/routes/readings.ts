import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { pool } from "../db.js";

const bodySchema = z.object({
  deviceId: z.number().int().positive(),
  readings: z
    .array(z.object({ value: z.number(), recordedAt: z.iso.datetime({ offset: true }) }))
    .min(1)
    .max(1000),
});

export const readingsRouter = Router();

readingsRouter.post("/", async (req, res) => {
  const { deviceId, readings } = bodySchema.parse(req.body);

  const { rowCount } = await pool.query(
    `INSERT INTO readings (device_id, value, recorded_at)
     SELECT d.id, r.value, r.recorded_at
     FROM devices d, unnest($2::numeric[], $3::timestamptz[]) AS r (value, recorded_at)
     WHERE d.id = $1`,
    [deviceId, readings.map((r) => r.value), readings.map((r) => r.recordedAt)],
  );
  if (!rowCount) throw createHttpError(422, `Device ${deviceId} does not exist`);

  res.status(201).json({ inserted: rowCount });
});
