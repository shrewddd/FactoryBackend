import express from "express"
import { authenticate } from "middleware/auth";
import { WorkstationController } from "controllers/workstations";

const router = express.Router()

const controller = new WorkstationController()

router.get("/", authenticate, controller.findMany)
router.get("/:id", controller.find)
// router.post("/", authenticate, controller.create) WIP
// router.put("/:id", authenticate, controller.update) WIP
// router.delete("/:id", authenticate, controller.delete) WIP

export default router;
