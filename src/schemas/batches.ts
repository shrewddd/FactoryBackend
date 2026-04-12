import { z } from "zod"; 
import { DbId } from "./utils";
import { ProductSchema } from "./products";
import { WorkstationSchema } from "./workstations";
import { BatchStatusSchema } from "./batchStatuses";
import { DepartmentSchema } from "./departments";
import { UserSchema } from "./user";
import { RoleSchema } from "./roles";

export const BatchWorkerSchema = z.object({
  department: z.object({
    id: DepartmentSchema.shape.id,
    label: DepartmentSchema.shape.label.nullish(),
  }),
  worker: z.object({
    id: UserSchema.shape.id,
    fullName: UserSchema.shape.fullName.nullish(),
    role: z.object({
      id: RoleSchema.shape.id,
      label: RoleSchema.shape.label.nullish(),
    }).nullish(),
  }),
});

const shared = {
  id: DbId,
  name: z.string().nullish(), 
  size: z.int().positive().default(100),
}

const mapped = {
  actualSize: z.int().positive().nullish(),
  product: z.object({
    id: ProductSchema.shape.id.nullish(),
    name: ProductSchema.shape.name.nullish(),
    measureUnitId: ProductSchema.shape.measureUnitId.nullish(),
  }),
  workstation: z.object({
    id: WorkstationSchema.shape.id.nullish(),
    name: WorkstationSchema.shape.name.nullish(),
  }),
  status: z.object({
    id: BatchStatusSchema.shape.id,
    label: BatchStatusSchema.shape.label.nullish(),
    sortOrder: BatchStatusSchema.shape.sortOrder.nullish(),
    isTerminal: BatchStatusSchema.shape.isTerminal.nullish(),
    allowsDefectReporting: BatchStatusSchema.shape.allowsDefectReporting.nullish(),
    isActive: BatchStatusSchema.shape.isActive.nullish(),
  }),
  workers: BatchWorkerSchema.array().nullish(),
  plannedFor: z.coerce.date().optional().default(() => new Date()),
  isActive: z.boolean().optional().default(true)
}

export const BatchSchema = z.object({ ...mapped, ...shared }); 

export const BatchRowSchema = z.object({
  ...shared,
  actual_size: mapped.actualSize,
  product_id: mapped.product.shape.id,
  product_name: mapped.product.shape.name,
  product_measure_unit_id: mapped.product.shape.measureUnitId,
  workstation_id: mapped.workstation.shape.id,
  workstation_name: mapped.workstation.shape.name,
  status_id: mapped.status.shape.id,
  status_label: mapped.status.shape.label,
  status_sort_order: mapped.status.shape.sortOrder,
  status_is_terminal: mapped.status.shape.isTerminal,
  status_allows_defect_reporting: mapped.status.shape.allowsDefectReporting,
  status_is_active: mapped.status.shape.isActive,
  workers: BatchWorkerSchema.array().nullish().default([]),
  planned_for: mapped.plannedFor,
  is_active: mapped.isActive,
})

export const BatchInsertSchama = BatchSchema
.omit({ id: true, product: true, workstation: true, status: true })
.partial({ size: true, actualSize: true })
.extend({
  productId: DbId.nullish(),
  workstationId: DbId.nullish(),
  statusId: DbId.nullish().default(1)
})

export const BatchFromRow = BatchRowSchema.transform((row): Batch => ({
  id: row.id,
  name: row.name,
  size: row.size,
  actualSize: row.actual_size,
  product: {
    id: row.product_id,
    name: row.product_name,
    measureUnitId: row.product_measure_unit_id,
  },
  workstation: {
    id: row.workstation_id,
    name: row.workstation_name,
  },
  status: {
    id: row.status_id,
    label: row.status_label,
    sortOrder: row.status_sort_order,
    isTerminal: row.status_is_terminal,
    allowsDefectReporting: row.status_allows_defect_reporting,
    isActive: row.status_is_active,
  },
  workers: row.workers,
  plannedFor: row.planned_for,
  isActive: row.is_active,
}))

export type Batch = z.infer<typeof BatchSchema>; 
export type BatchRow = z.infer<typeof BatchRowSchema>
export type BatchInsert = z.infer<typeof BatchInsertSchama>
