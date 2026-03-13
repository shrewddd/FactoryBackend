import express from "express";
import { asyncHandler } from "utils/errorHandler";
import type { ProductService } from "services_new/products";
import { paramsSchema } from "schemas/utils";
import { ProductInsertSchema } from "schemas/products";

export class ProductController {

  constructor(private productService: ProductService) {}

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
}
