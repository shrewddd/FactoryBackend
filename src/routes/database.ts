import { migrateDatabase, testDatabase } from "controllers/database"; import express from "express"
import { asyncHandler } from "utils/errorHandler";
import { seed } from "utils/queries/seed";

const router = express.Router()

router.get("/test", testDatabase)
router.get("/migrate", migrateDatabase)
router.get("/seed", asyncHandler(async (req: express.Request, res: express.Response) => {
  await seed();
  res.status(200).end();
}))

export default router;
