import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { createSite } from "./fixtures.js";

describe("POST /readings", () => {
  it("inserts a batch of readings", async () => {
    const {
      deviceIds: [deviceId],
    } = await createSite("Test Site", ["Sensor A"]);

    const response = await request(app)
      .post("/readings")
      .send({
        deviceId,
        readings: [
          { value: 21.5, recordedAt: "2026-01-01T00:00:00Z" },
          { value: 22.25, recordedAt: "2026-01-01T00:05:00Z" },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ inserted: 2 });
    const { rows } = await pool.query("SELECT value FROM readings WHERE device_id = $1 ORDER BY recorded_at", [
      deviceId,
    ]);
    expect(rows).toEqual([{ value: 21.5 }, { value: 22.25 }]);
  });
});
