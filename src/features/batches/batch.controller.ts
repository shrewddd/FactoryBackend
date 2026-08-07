import express from "express";
import { Controller } from "abstract/controller";
import { BatchAdvanceRequestSchema, BatchInsertSchema, BatchMergeRequestSchema, BatchPatchSchema, type Batch, type BatchInsert } from "./batch.schema";
import { BatchService } from "./batch.service";
import { asyncHandler } from "utils/errorHandler";
import type { ZodType } from "zod";

export class BatchController extends Controller<Batch, BatchInsert, BatchService> {
  constructor(service: BatchService = new BatchService()) {
    super(service, BatchInsertSchema, BatchPatchSchema as ZodType<Partial<BatchInsert>>);
  }

  findManyWithAll = asyncHandler(async (_req: express.Request, res: express.Response) => {
    const result = await this.service.findManyWithAll();
    res.status(200).json(result);
  });

  merge = asyncHandler(async (req: express.Request, res: express.Response) => {
    const batchAId = Number(req.params.id);
    const { batchBId, actorId } = BatchMergeRequestSchema.parse(req.body);

    await this.service.merge(batchAId, batchBId, actorId);

    res.status(200).json({ success: true });
  });

  advance = asyncHandler(async (req: express.Request, res: express.Response) => {
    const batchId = Number(req.params.id);
    const { actorId, coworkers, defects, sizeOverride, remainder } = BatchAdvanceRequestSchema.parse(req.body);

    await this.service.advance(
      batchId,
      actorId,
      coworkers,
      defects.map((d) => ({ defect_type_id: d.defectTypeId, quantity: d.quantity })),
      sizeOverride,
      remainder
    );

    res.status(200).json({ success: true });
  });
}
