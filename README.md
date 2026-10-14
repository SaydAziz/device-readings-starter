# Device Readings

A small API that stores sensor readings from devices and summarizes them per site.

Built with Node.js, TypeScript, Express, and PostgreSQL (plain SQL through `pg`).

## Run it

You need Node.js 20.19 or later and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d --wait
npm run db:migrate && npm run db:seed
npm run dev
```

The API now runs on http://localhost:3000. The seed creates 3 sites, 20 devices, and 50,000 readings from the last 60 days.

Run the tests with `npm test`. They use a separate `readings_test` database, which the test run creates and migrates for you.

## Routes

### `POST /readings`

Stores a batch of readings for one device.

```bash
curl -X POST http://localhost:3000/readings \
  -H "Content-Type: application/json" \
  -d '{"deviceId": 1, "readings": [{"value": 21.5, "recordedAt": "2026-10-13T09:00:00Z"}]}'
```

```json
{ "inserted": 1 }
```

### `GET /sites/:id/summary`

Returns the reading count, min, max, and latest reading for each device in a site. Returns 404 if the site does not exist.

```bash
curl http://localhost:3000/sites/1/summary
```

```json
{
  "site": { "id": 1, "name": "North Plant" },
  "devices": [
    {
      "id": 1,
      "name": "Sensor 01",
      "count": 2472,
      "min": 0,
      "max": 100,
      "latest": { "value": 51.5, "recordedAt": "2026-10-13T04:18:38.221Z" }
    }
  ]
}
```

Invalid input returns 400 with the validation issues.

## Scripts

| Script               | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the server and restart on file changes |
| `npm run build`      | Compile TypeScript to `dist/`                |
| `npm start`          | Run the compiled server                      |
| `npm test`           | Run the test suite against `readings_test`   |
| `npm run type-check` | Check types without emitting files           |
| `npm run lint`       | Lint the project with ESLint                 |
| `npm run db:migrate` | Apply pending SQL migrations                 |
| `npm run db:seed`    | Replace all data with fresh sample data      |

## Project layout

```
migrations/          SQL migrations, applied in file name order
scripts/
  migrate.ts         Applies migrations (creates readings_test when NODE_ENV=test)
  seed.ts            Loads sample data
src/
  app.ts             Express app: middleware and routes
  config.ts          Reads and validates environment variables
  db.ts              PostgreSQL connection pool
  errors.ts          404 and error-handling middleware
  server.ts          Starts the server and shuts it down cleanly
  routes/
    readings.ts      POST /readings
    sites.ts         GET /sites/:id/summary
tests/               Vitest tests that run against a real database
docker-compose.yml   PostgreSQL 16 on port 5432
```
