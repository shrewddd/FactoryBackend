import { z } from "zod";
import { DbId } from "schemas/utils";
import { DepartmentSchema } from "features/departments/department.schema";

const shared = {
  id: DbId,
  label: z.string(),
};
const mapped = {
  sortOrder: z.int(),
  isTerminal: z.boolean().default(false),
  allowsDefectReporting: z.boolean().default(false),
  isActive: z.boolean().default(false),
  isInProgress: z.boolean().default(false),
  isFinished: z.boolean().default(false),
  requiresSizeInput: z.boolean().default(false),
  isPackaging: z.boolean().default(false),
  subtractDefects: z.boolean().default(true),
  isMilestone: z.boolean().default(false),
  isInventoryMilestone: z.boolean().default(false),
};

const relations = {
  department: z.object({
    id: DepartmentSchema.shape.id,
    label: DepartmentSchema.shape.label.nullish(),
  }).nullable(),
};

export const BatchStatusSchema = z.object({ ...shared, ...mapped, ...relations }).meta({ id: "BatchStatus" });

export const BatchStatusRowSchema = z.object({
  ...shared,
  sort_order: mapped.sortOrder,
  is_terminal: mapped.isTerminal,
  allows_defect_reporting: mapped.allowsDefectReporting,
  is_active: mapped.isActive,
  is_in_progress: mapped.isInProgress,
  is_finished: mapped.isFinished,
  requires_size_input: mapped.requiresSizeInput,
  is_packaging: mapped.isPackaging,
  subtract_defects: mapped.subtractDefects,
  is_milestone: mapped.isMilestone,
  is_inventory_milestone: mapped.isInventoryMilestone,
  department_id: DepartmentSchema.shape.id.nullish(),
  department_label: DepartmentSchema.shape.label.nullish(),
});

export const BatchStatusFromRow = BatchStatusRowSchema.transform((row) => {
  const {
    sort_order,
    is_terminal,
    allows_defect_reporting,
    is_active,
    is_in_progress,
    is_finished,
    requires_size_input,
    is_packaging,
    subtract_defects,
    is_milestone,
    is_inventory_milestone,
    department_id,
    department_label,
    ...rest
  } = row;
  return {
    ...rest,
    sortOrder: sort_order,
    isTerminal: is_terminal,
    allowsDefectReporting: allows_defect_reporting,
    isActive: is_active,
    isInProgress: is_in_progress,
    isFinished: is_finished,
    requiresSizeInput: requires_size_input,
    isPackaging: is_packaging,
    subtractDefects: subtract_defects,
    isMilestone: is_milestone,
    isInventoryMilestone: is_inventory_milestone,
    department: department_id
      ? {
        id: department_id,
        label: department_label,
      }
      : null,
  };
});

export const BatchStatusInsertSchema = BatchStatusSchema
  .omit({ id: true })
  .partial({ isActive: true, department: true })
  .meta({ id: "BatchStatusInsert" });

export const BatchStatusLookupSchema = z.union([z.object({ id: z.number().positive() })]);

export type BatchStatus = z.infer<typeof BatchStatusSchema>;
export type BatchStatusRow = z.infer<typeof BatchStatusRowSchema>;
export type BatchStatusInsert = z.infer<typeof BatchStatusInsertSchema>;
export type BatchStatusLookup = z.infer<typeof BatchStatusLookupSchema>;
