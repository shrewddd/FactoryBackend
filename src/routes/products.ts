import express from 'express'
import { createProductController, deleteProductController, getProductController, getProductsController, updateProductController } from 'controllers/products';
import { authenticate } from 'middleware/auth';

const router = express.Router();

router.get('/', authenticate, getProductsController);
router.get('/:id', getProductController)
router.post('/', authenticate, createProductController)
router.put('/:id', authenticate, updateProductController)
router.delete('/:id', authenticate, deleteProductController)

export default router;
