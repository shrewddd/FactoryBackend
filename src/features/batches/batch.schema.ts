import { BatchStatusSchema } from "features/batchStatuses/batchStatus.schema";
import { ProductSchema } from "features/products/product.schema";
import { WorkstationSchema } from "features/workstations/workstation.schema";
import { DepartmentSchema } from "features/departments/department.schema";
import { DbId } from "schemas/utils";
import { z } from "zod"; 
import { BatchTransitionSchema } from "features/batchTransitions/batchTransitions.schema";
import { DefectFromRow, DefectRowSchema, DefectSchema } from "features/defects/defect.schema";
import { UserSchema } from "features/users/user.schema";

const CoworkerSchema = z.object({
  id: UserSchema.shape.id,
  fullName: UserSchema.shape.fullName.nullish(),
});

const BatchStatusRelationSchema = z.object({
  id: BatchStatusSchema.shape.id,
  label: BatchStatusSchema.shape.label.nullish(),
  isTerminal: BatchStatusSchema.shape.isTerminal.nullish(),
  sortOrder: BatchStatusSchema.shape.sortOrder.nullish(),
  allowsDefectReporting: BatchStatusSchema.shape.allowsDefectReporting.nullish(),
  isActive: BatchStatusSchema.shape.isActive.nullish(),
  isInProgress: BatchStatusSchema.shape.isInProgress.nullish(),
  isFinished: BatchStatusSchema.shape.isFinished.nullish(),
  requiresSizeInput: BatchStatusSchema.shape.requiresSizeInput.nullish(),
  isPackaging: BatchStatusSchema.shape.isPackaging.nullish(),
  subtractDefects: BatchStatusSchema.shape.subtractDefects.nullish(),
  isMilestone: BatchStatusSchema.shape.isMilestone.nullish(),
  department: z.object({
    id: DepartmentSchema.shape.id.nullish(),
    label: DepartmentSchema.shape.label.nullish(),
  }).nullish(),
})

const DefaultBatchStatusRelationSchema = BatchStatusRelationSchema.default({
  id: 1,
  department: {},
});

const shared = {
  id: DbId,
  name: z.string().nullish(), 
  size: z.int().min(0).nullable(),
}

const mapped = {
  isActive: z.boolean().optional().default(true)
}

const relations = {
  product: z.object({
    id: ProductSchema.shape.id.nullish(),
    name: ProductSchema.shape.name.nullish(),
  }),
  workstation: z.object({
    id: WorkstationSchema.shape.id.nullish(),
    name: WorkstationSchema.shape.name.nullish(),
  }),
  status: BatchStatusRelationSchema,
  transitions: z.object({
    id: BatchTransitionSchema.shape.id,
    occuredAt: BatchTransitionSchema.shape.occurredAt,
    batch: z.object({
      size: BatchTransitionSchema.shape.batch.shape.size,
    }),
    device: z.object({ 
      id: BatchTransitionSchema.shape.device.shape.id ,
      name: BatchTransitionSchema.shape.device.shape.name 
    }),
    actor: z.object({ 
      id: BatchTransitionSchema.shape.actor.shape.id,
      fullName: BatchTransitionSchema.shape.actor.shape.fullName
    }),
    fromStatus: BatchStatusRelationSchema,
    toStatus: BatchStatusRelationSchema,
    coworkers: CoworkerSchema.array().default([]),
    defects: DefectSchema.array().default([])
  }).array().default([])
}

export const BatchSchema = z.object({ ...mapped, ...shared, ...relations }).meta({ id: "Batch" }); 

export const BatchRowSchema = z.object({
  ...shared,
  product_id: relations.product.shape.id,
  product_name: relations.product.shape.name,
  workstation_id: relations.workstation.shape.id,
  workstation_name: relations.workstation.shape.name,
  status_id: BatchStatusRelationSchema.shape.id,
  status_label: BatchStatusRelationSchema.shape.label,
  status_sort_order: BatchStatusRelationSchema.shape.sortOrder,
  status_is_terminal: BatchStatusRelationSchema.shape.isTerminal,
  status_allows_defect_reporting: BatchStatusRelationSchema.shape.allowsDefectReporting,
  status_is_active: BatchStatusRelationSchema.shape.isActive,
  status_is_in_progress: BatchStatusRelationSchema.shape.isInProgress,
  status_is_finished: BatchStatusRelationSchema.shape.isFinished,
  status_requires_size_input: BatchStatusRelationSchema.shape.requiresSizeInput,
  status_is_packaging: BatchStatusRelationSchema.shape.isPackaging,
  status_subtract_defects: BatchStatusRelationSchema.shape.subtractDefects,
  status_is_milestone: BatchStatusRelationSchema.shape.isMilestone,
  status_department_id: DepartmentSchema.shape.id.nullish(),
  status_department_label: DepartmentSchema.shape.label.nullish(),
  is_active: mapped.isActive,
  transitions: z.object({
    id: BatchTransitionSchema.shape.id,
    occurred_at: BatchTransitionSchema.shape.occurredAt,
    batch_size: BatchTransitionSchema.shape.batch.shape.size,

    device_id: BatchTransitionSchema.shape.device.shape.id,
    device_name: BatchTransitionSchema.shape.device.shape.name,

    actor_id: BatchTransitionSchema.shape.actor.shape.id,
    actor_name: BatchTransitionSchema.shape.actor.shape.fullName,

    from_status_id: BatchStatusRelationSchema.shape.id,
    from_status_label: BatchStatusRelationSchema.shape.label,
    from_status_sort_order: BatchStatusRelationSchema.shape.sortOrder,
    from_status_is_terminal: BatchStatusRelationSchema.shape.isTerminal,
    from_status_allows_defect_reporting: BatchStatusRelationSchema.shape.allowsDefectReporting,
    from_status_is_active: BatchStatusRelationSchema.shape.isActive,
    from_status_is_in_progress: BatchStatusRelationSchema.shape.isInProgress,
    from_status_is_finished: BatchStatusRelationSchema.shape.isFinished,
    from_status_requires_size_input: BatchStatusRelationSchema.shape.requiresSizeInput,
    from_status_is_packaging: BatchStatusRelationSchema.shape.isPackaging,
    from_status_subtract_defects: BatchStatusRelationSchema.shape.subtractDefects,
    from_status_is_milestone: BatchStatusRelationSchema.shape.isMilestone,
    from_status_department_id: DepartmentSchema.shape.id.nullish(),
    from_status_department_label: DepartmentSchema.shape.label.nullish(),

    to_status_id: BatchStatusRelationSchema.shape.id,
    to_status_label: BatchStatusRelationSchema.shape.label,
    to_status_sort_order: BatchStatusRelationSchema.shape.sortOrder,
    to_status_is_terminal: BatchStatusRelationSchema.shape.isTerminal,
    to_status_allows_defect_reporting: BatchStatusRelationSchema.shape.allowsDefectReporting,
    to_status_is_active: BatchStatusRelationSchema.shape.isActive,
    to_status_is_in_progress: BatchStatusRelationSchema.shape.isInProgress,
    to_status_is_finished: BatchStatusRelationSchema.shape.isFinished,
    to_status_requires_size_input: BatchStatusRelationSchema.shape.requiresSizeInput,
    to_status_is_packaging: BatchStatusRelationSchema.shape.isPackaging,
    to_status_subtract_defects: BatchStatusRelationSchema.shape.subtractDefects,
    to_status_is_milestone: BatchStatusRelationSchema.shape.isMilestone,
    to_status_department_id: DepartmentSchema.shape.id.nullish(),
    to_status_department_label: DepartmentSchema.shape.label.nullish(),

    coworkers: z.object({
      id: UserSchema.shape.id,
      full_name: UserSchema.shape.fullName,
    }).array().default([]),
    defects: DefectRowSchema.array().default([])
  }).array().default([])
})

export const BatchInsertSchema = BatchSchema
  .omit({ id: true, transitions: true, status: true })
  .partial({ product: true, workstation: true, size: true, isActive: true })
  .extend({
    status: BatchStatusRelationSchema.default({ id: 1, department: {} }),
  })
  .meta({ id: "BatchInsert" });

export const BatchPatchSchema = BatchSchema
  .omit({ id: true, transitions: true })
  .partial()
  .meta({ id: "BatchPatch" });

export const BatchFromRow = BatchRowSchema.transform((row): Batch => ({
  id: row.id,
  name: row.name,
  size: row.size,
  product: {
    id: row.product_id,
    name: row.product_name,
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
    isInProgress: row.status_is_in_progress,
    isFinished: row.status_is_finished,
    requiresSizeInput: row.status_requires_size_input,
    isPackaging: row.status_is_packaging,
    subtractDefects: row.status_subtract_defects,
    isMilestone: row.status_is_milestone,
    department: {
      id: row.status_department_id,
      label: row.status_department_label,
    }
  },
  isActive: row.is_active,
  transitions: row.transitions.map((t) => ({
    id: t.id,
    occuredAt: t.occurred_at,
    batch: {
      size: t.batch_size,
    },
    device: {
      id: t.device_id,
      name: t.device_name,
    },
    actor: {
      id: t.actor_id,
      fullName: t.actor_name,
    },
    fromStatus: {
      id: t.from_status_id,
      label: t.from_status_label,
      isTerminal: t.from_status_is_terminal,
      allowsDefectReporting: t.from_status_allows_defect_reporting,
      isActive: t.from_status_is_active,
      isInProgress: t.from_status_is_in_progress,
      isFinished: t.from_status_is_finished,
      requiresSizeInput: t.from_status_requires_size_input,
      isPackaging: t.from_status_is_packaging,
      subtractDefects: t.from_status_subtract_defects,
      isMilestone: t.from_status_is_milestone,
      department: {
        id: t.from_status_department_id,
        label: t.from_status_department_label
      }
    },
    toStatus: {
      id: t.to_status_id,
      label: t.to_status_label,
      isTerminal: t.to_status_is_terminal,
      allowsDefectReporting: t.to_status_allows_defect_reporting,
      isActive: t.to_status_is_active,
      isInProgress: t.to_status_is_in_progress,
      isFinished: t.to_status_is_finished,
      requiresSizeInput: t.to_status_requires_size_input,
      isPackaging: t.to_status_is_packaging,
      subtractDefects: t.to_status_subtract_defects,
      isMilestone: t.to_status_is_milestone,
      department: {
        id: t.to_status_department_id,
        label: t.to_status_department_label
      }
    },
    coworkers: t.coworkers.map(c => ({
      id: c.id,
      fullName: c.full_name,
    })),
    defects: t.defects.map((d) => DefectFromRow.parse(d)),
  }))
}));

export const BatchActiveByWorkerParamsSchema = z.object({
  workerId: z.coerce.number().int().positive(),
});

export const BatchMergeRequestSchema = z.object({
  batchBId: DbId,
  actorId: DbId,
}).meta({ id: "BatchMergeRequest" });

export type BatchMergeRequest = z.infer<typeof BatchMergeRequestSchema>;

export const BatchAdvanceRequestSchema = z.object({
  actorId: DbId,
  coworkers: DbId.array().default([]),
  defects: z.object({
    defectTypeId: DbId,
    quantity: z.int().min(1),
  }).array().default([]),
  sizeOverride: z.int().positive().optional(),
  remainder: z.int().min(0).optional(),
}).meta({ id: "BatchAdvanceRequest" });

export type BatchAdvanceRequest = z.infer<typeof BatchAdvanceRequestSchema>;

export const BatchLookupSchema = z.union([
  z.object({ id: z.number().positive() })
]);

export type Batch = z.infer<typeof BatchSchema>; 
export type BatchRow = z.infer<typeof BatchRowSchema>
export type BatchInsert = z.infer<typeof BatchInsertSchema>
export type BatchLookup = z.infer<typeof BatchLookupSchema>
