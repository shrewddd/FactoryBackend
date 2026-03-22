import { BatchController } from "controllers_new/batches";
import express from "express";
import { authenticate } from "middleware/auth";

const router = express.Router();

const controller = new BatchController()

router.get('/', authenticate, controller.findMany)
router.get('/:id', controller.find)
router.post('/', authenticate, controller.create)
// router.post('/bulk', authenticate, createBatchesController)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.delete)
router.patch('/:id/advance', authenticate, controller.advance)
// router.patch('/:id/spoilage', persistSpoilageController)

export default router;
