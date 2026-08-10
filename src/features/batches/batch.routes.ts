import express from "express";
import { BatchController } from "./batch.controller";

const router = express.Router();

const controller = new BatchController();

router.get("/", controller.findMany);
router.post("/", controller.create);
router.get("/expanded", controller.findManyWithAll);
router.get("/active/:workerId", controller.findActiveByWorker);
router.post("/bulk", controller.createMany);
router.post("/bulk/update", controller.updateMany);
router.post("/bulk/patch", controller.patchMany);
router.post("/bulk/delete", controller.deleteMany);
router.get("/:id", controller.find);
router.put("/:id", controller.update);
router.patch("/:id", controller.patch);
router.delete("/:id", controller.delete);
router.post("/:id/merge", controller.merge);
router.post("/:id/advance", controller.advance);

export default router;
