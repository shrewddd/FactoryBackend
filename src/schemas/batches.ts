import { z } from "zod"; 
import { DbId, Timestamps } from "./utils";
import { DatabaseProductSchema, ProductSchema } from "./products";

const progressEnum = z.enum([
  'Inactive', 
  'Knitting Workshop (In-Progress)',
  'Knitting Workshop (Finished)',
  'Sewing Workshop (In-Progress)',
  'Sewing Workshop (Finished)',
  'Molding Workshop (In-Progress)',
  'Molding Workshop (Finished)',
  'Labeling Workshop (In-Progress)',
  'Labeling Workshop (Finished)',
  'Packaging Workshop (In-Progress)',
  'Packaging Workshop (Finished)',
  'Completed'
])

const shared = {
  id: DbId,
  name: z.string().nullish(), 
  size: z.int().positive().default(100),
}

const mapped = {
  productId: DbId.nullish(),
  workstationId: DbId,
  progressStatus: progressEnum,
  masters: z.object({
    knitting: DbId.nullish(),
    sewing: DbId.nullish(),
    molding: DbId.nullish(),
    labeling: DbId.nullish(),
    packaging: DbId.nullish(),
  }),
  isPlanned: z.boolean(),
  plannedFor: z.coerce.date().default(() => new Date()),
 ...Timestamps
}

export const BatchSchema = z.object({ 
  ...mapped,
  ...shared,
}); 

export const BatchWithProductSchema = BatchSchema.extend({
  product: {...ProductSchema.omit({ id: true })}
})

export const DatabaseBatchSchema = z.object({
  ...shared,
  product_id: mapped.productId,
  knitting_worker_id: mapped.masters.shape.knitting,
  sewing_worker_id: mapped.masters.shape.sewing,
  molding_worker_id: mapped.masters.shape.molding,
  labeling_worker_id: mapped.masters.shape.labeling,
  packaging_worker_id: mapped.masters.shape.packaging,
  workstation_id: mapped.workstationId,
  progress_status: mapped.progressStatus,
  is_planned: mapped.isPlanned,
  planned_for: mapped.plannedFor,
  updated_at: mapped.updatedAt,
  created_at: mapped.createdAt,
})

export const DatabaseBatchWithProductSchema = DatabaseBatchSchema.extend({
  product: {...DatabaseProductSchema.omit({ id: true })}
})

export const BatchFromDatabase = DatabaseBatchSchema.transform((db) => ({
  id: db.id,
  name: db.name,
  size: db.size,
  productId: db.product_id,
  masters: {
    knitting: db.knitting_worker_id,
    sewing: db.sewing_worker_id,
    molding: db.molding_worker_id,
    labeling: db.labeling_worker_id,
    packaging: db.packaging_worker_id,
  },
  workstationId: db.workstation_id,
  progressStatus: db.progress_status,
  isPlanned: db.is_planned,
  plannedFor: db.planned_for,
  updatedAt: db.updated_at,
  createdAt: db.created_at,
}))

export const BatchWithProductFromDatabase = DatabaseBatchWithProductSchema.transform((db) => {
  const batch = BatchFromDatabase.parse(db)
  return {
    ...batch,
    product: {
      code: db.product.code,
      category: db.product.category,
      name: db.product.name,
      isActive: db.product.is_active,
      measureUnit: db.product.measure_unit,
    }
  }
})

export const DatabaseFromBatch = BatchSchema.transform((batch) => ({
  id: batch.id,
  name: batch.name,
  product_id: batch.productId,
  size: batch.size,
  knitting_worker_id: batch.masters.knitting,
  sewing_worker_id: batch.masters.sewing,
  molding_worker_id: batch.masters.molding,
  labeling_worker_id: batch.masters.labeling,
  packaging_worker_id: batch.masters.packaging,
  workstation_id: batch.workstationId,
  progress_status: batch.progressStatus,
  is_planned: batch.isPlanned,
  planned_for: batch.plannedFor,
  updated_at: batch.updatedAt,
  created_at: batch.createdAt,
}))

export const DatabaseFromBatches = DatabaseFromBatch.array();
export const BatchesFromDatabase = BatchFromDatabase.array();
export const BatchesWithProductFromDatabase = BatchWithProductFromDatabase.array();

export const InsertBatchSchema = BatchSchema.omit({ 
  id: true, 
  progressStatus: true, 
  updatedAt: true, 
  createdAt: true, 
}); 

export const InitializeBatchSchema = InsertBatchSchema
  .extend({amount: z.int(),})
  .transform(({ amount, ...batch }) => ({ batch, amount }));

export type Batch = z.infer<typeof BatchSchema>; 
export type BatchWithProduct = z.infer<typeof BatchWithProductSchema>;
export type DatabaseBatch = z.infer<typeof DatabaseBatchSchema>;
export type DatabaseBatchWithProduct = z.infer<typeof DatabaseBatchWithProductSchema>;
export type InsertBatch = z.infer<typeof InsertBatchSchema>;
export type InitializeBatch = z.infer<typeof InitializeBatchSchema>;
