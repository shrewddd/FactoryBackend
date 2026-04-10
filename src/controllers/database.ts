import express from "express"
import { query } from "db";
import { migrate } from "migration";

export const testDatabase = async (req: express.Request, res: express.Response) => {
  const result = await query("SELECT NOW()");
  if (result == undefined || result == null) {
    res.status(500).send("PostgreSQL is not working");
  }
  res.status(200).send(`PostgreSQL is online, server time is: ${result.rows[0].now}`);
}

export const migrateDatabase = async (req: express.Request, res: express.Response) => {
  var result = await migrate();
  if (result == undefined || result == null || result == false) {
    res.status(500).send("Migration failed");
  }
  res.status(200).send("Migration succeed");
};
