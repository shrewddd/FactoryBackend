import { migrateDatabase, seedDatabase, testDatabase } from "controllers/database"; import express from "express"

const router = express.Router()

router.get("/test", testDatabase)
router.get("/migrate", migrateDatabase)
router.get("/seed", seedDatabase)

export default router;
