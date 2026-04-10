import express from "express";
import { asyncHandler } from "utils/errorHandler";
import { ProductService } from "services/products";
import { paramsSchema } from "schemas/utils";
import { ProductInsertSchema } from "schemas/products";

export class ProductController {

  private productService: ProductService;

  constructor(productService?: ProductService) {
    this.productService = productService ?? new ProductService()
  }

  find = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.productService.find(id);
    res.status(200).json(result);
  });

  findMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.productService.findMany();
    res.status(200).json(result);
  });

  update = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const data = ProductInsertSchema.parse(req.body);
    const result = await this.productService.update(id, data);
    res.status(200).json(result);
  });

  // delete

  findQuantities = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.productService.findQuantities();
    res.status(200).json(result);
  });
}
