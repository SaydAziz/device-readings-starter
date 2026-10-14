import { existsSync } from "node:fs";
import { z } from "zod";

if (existsSync(".env")) process.loadEnvFile();

const env = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  })
  .parse(process.env);

function testDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname += "_test";
  return url.href;
}

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.NODE_ENV === "test" ? testDatabaseUrl(env.DATABASE_URL) : env.DATABASE_URL,
};
