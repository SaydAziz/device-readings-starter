import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { createSite } from "./fixtures.js";

describe("GET /sites/:id/summary", () => {
  it("summarizes readings per device for a seeded site", async () => {
    const {
      siteId,
      deviceIds: [activeId, idleId],
    } = await createSite("Test Site", ["Active Sensor", "Idle Sensor"]);
    await request(app)
      .post("/readings")
      .send({
        deviceId: activeId,
        readings: [
          { value: 10, recordedAt: "2026-01-01T00:00:00Z" },
          { value: 30, recordedAt: "2026-01-01T01:00:00Z" },
          { value: 20, recordedAt: "2026-01-01T02:00:00Z" },
        ],
      })
      .expect(201);

    const response = await request(app).get(`/sites/${siteId}/summary`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      site: { id: siteId, name: "Test Site" },
      devices: [
        {
          id: activeId,
          name: "Active Sensor",
          count: 3,
          min: 10,
          max: 30,
          latest: { value: 20, recordedAt: "2026-01-01T02:00:00.000Z" },
        },
        { id: idleId, name: "Idle Sensor", count: 0, min: null, max: null, latest: null },
      ],
    });
  });

  it("returns 404 for an unknown site", async () => {
    const response = await request(app).get("/sites/999/summary");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Site 999 not found" });
  });
});
