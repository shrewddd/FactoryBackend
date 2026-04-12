import express from "express";
import { query } from "db";
import { migrate } from "migration";
import { asyncHandler } from "utils/errorHandler";
import { addNewUsers } from "utils/queries/seed";

export const testDatabase = asyncHandler(async (req: express.Request, res: express.Response) => {
  const result = await query("SELECT NOW()");
  if (result === undefined || result == null) {
    res.status(500).send("PostgreSQL is not working");
  }
  res.status(200).send(`PostgreSQL is online, server time is: ${result.rows[0].now}`);
})

export const migrateDatabase = asyncHandler(async (req: express.Request, res: express.Response) => {
  var result = await migrate();
  if (result === undefined || result === null || result === false) {
    res.status(500).send("Migration failed");
  }
  res.status(200).send("Migration succeed");
});

export const seedDatabase = asyncHandler(async (req: express.Request, res: express.Response) => {
  await addNewUsers();
  res.status(200).end();
});


