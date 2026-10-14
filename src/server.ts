import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(config.port, (error) => {
  if (error) throw error;
  console.log(`Listening on http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  server.close(async () => {
    await pool.end();
    console.log("Shutdown complete");
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
