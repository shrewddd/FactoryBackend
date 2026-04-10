
import { paramsSchema } from "schemas/utils";
import { asyncHandler } from "utils/errorHandler";
import type express from "express";
import { BatchService } from "services/batches";
import { BatchInsertSchama } from "schemas/batches";
import { size } from "zod";

export class BatchController {

  private batchService: BatchService;

  constructor (batchService?: BatchService) {
    this.batchService = batchService ?? new BatchService()
  }

  find = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.batchService.find(id)
    res.status(200).json(result);
  });

  findMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.batchService.findMany()
    res.status(200).json(result);
  });

  create = asyncHandler(async (req: express.Request, res: express.Response) => {
    console.log(req.body)
    const data = BatchInsertSchama.parse(req.body)
    console.log(data)
    const result = await this.batchService.create(data)
    res.status(200).json(result);
  });

  update = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params) 
    console.log(id, req.body)
    const data = BatchInsertSchama.parse(req.body); 
    const result = await this.batchService.update(id, data);
    res.status(200).json(result)
  });

  softDelete = asyncHandler(async (req: express.Request, res: express.Response) => {

  });

  delete = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.batchService.delete(id);
    res.status(200).json(result);
  });

  advance = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const actorId = req.userId ??  0;
    const { defects = [], sizeOverride } = req.body;
    const result = await this.batchService.advance(id, actorId, defects, sizeOverride);
    res.status(200).json(result);
  });
}
