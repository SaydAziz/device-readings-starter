import pg from "pg";
import { config } from "./config.js";

pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

pool.on("error", (error) => {
  console.error("Unexpected error on idle database client", error);
});
