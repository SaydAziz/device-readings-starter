import { afterAll, beforeEach } from "vitest";
import { pool } from "../src/db.js";

beforeEach(async () => {
  await pool.query("TRUNCATE sites, devices, readings RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await pool.end();
});
