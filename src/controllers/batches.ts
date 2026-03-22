// import express from 'express'
// import { BatchesFromDatabase, BatchesWithProductFromDatabase, BatchFromDatabase, InitializeBatchSchema, InsertBatchSchema } from "schemas/batches";
// import { paramsSchema } from 'schemas/utils';
// import { asyncHandler } from 'utils/errorHandler';
// import { batchesService as service } from 'services/batches';
// import logger from 'logger';
//
//
// export const getBatchController = asyncHandler( async (req: express.Request, res: express.Response) => {
//   const { id } = paramsSchema.parse(req.params)
//   const data = await service.get(id)
//   const batch = BatchFromDatabase.parse(data)
//   res.status(200).json(batch);
// })
//
// export const getBatchesController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const withProducts = req.query.withProducts === 'true'
//   const data = withProducts ? await service.getAllWithProducts() : await service.getAll()
//   const batches = withProducts ? BatchesWithProductFromDatabase.parse(data) : BatchesFromDatabase.parse(data)
//   res.status(200).json(batches);
// })
//
// export const createBatchController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const data = InsertBatchSchema.parse(req.body)
//   const result = await service.create(data)
//   const batch = BatchFromDatabase.parse(result)
//   res.status(200).json(batch);
// })
//
// export const updateBatchController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const { id } = paramsSchema.parse(req.params)
//   const data = InsertBatchSchema.parse(req.body)
//   const result = await service.update(id, data)
//   const batch = BatchFromDatabase.parse(result)
//   res.status(200).json(batch);
// })
//
// export const deleteBatchController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const { id } = paramsSchema.parse(req.params)
//   const data = await service.delete(id)
//   const batch = BatchFromDatabase.parse(data)
//   res.status(200).json(batch);
// })
//
// export const scanBatchController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const { id } = paramsSchema.parse(req.params)
//   console.log(`User: ${req.userId} scanned batch: ${id}`)
//   const data = await service.scan(id);
//   res.status(200).json(data);
// })
//
// export const updateBatchSpoilageController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const { id } = paramsSchema.parse(req.params)
//   const data = await service.scan(id);
//   res.status(200).json(data);
// })
//
// export const createBatchesController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const { batch, amount } = InitializeBatchSchema.parse(req.body);
//   const data = await service.createMultiple(batch, amount);
//   res.status(200).json(data);
// })
//
// export const initializePlannedBatchesController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const data = await service.initializePlanned();
//   const plannedBatches = BatchesFromDatabase.parse(data);
//   res.status(201).json(plannedBatches);
// })
//
// export const executePlannedBatchesController = asyncHandler(async (req: express.Request, res: express.Response) => {
//   const data = await service.executePlanned();
//   const plannedBatches = BatchesFromDatabase.parse(data);
//   res.status(201).json(plannedBatches);
// })
//
// export const persistSpoilageController = asyncHandler(async (req, res) => {
//   const { id } = paramsSchema.parse(req.params);
//   const { defects } = req.body;
//   logger.log(defects)
//   await service.logSpoilage(id, defects)
//   res.status(200).json({ ok: true });
// });
