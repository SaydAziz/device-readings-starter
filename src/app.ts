import express from "express";
import { errorHandler, notFound } from "./errors.js";
import { readingsRouter } from "./routes/readings.js";
import { sitesRouter } from "./routes/sites.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/readings", readingsRouter);
app.use("/sites", sitesRouter);
app.use(notFound);
app.use(errorHandler);
