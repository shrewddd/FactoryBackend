
import { z } from "zod";
import { DbId } from "./utils";

const shared = {
  id: DbId,
  label: z.string(),
};

const mapped = {
  sortOrder: z.int(),
  isTerminal: z.boolean().default(false),
  allowsDefectReporting: z.boolean().default(false),
  isActive: z.boolean().default(false),
};

export const BatchStatusSchema = z.object({ ...shared, ...mapped });

export const BatchStatusRowSchema = z.object({
  ...shared,
  sort_order: mapped.sortOrder,
  is_terminal: mapped.isTerminal,
  allows_defect_reporting: mapped.allowsDefectReporting,
  is_active: mapped.isActive,
});

export const BatchStatusInsertSchema = BatchStatusSchema.omit({ id: true }).partial({ isActive: true });

export const BatchStatusFromRow = BatchStatusRowSchema.transform((row) => {
  const { sort_order, is_terminal, allows_defect_reporting, is_active, ...rest } = row;
  return {
    ...rest,
    sortOrder: sort_order,
    isTerminal: is_terminal,
    allowsDefectReporting: allows_defect_reporting,
    isActive: is_active,
  };
});

export type BatchStatus = z.infer<typeof BatchStatusSchema>;
export type BatchStatusRow = z.infer<typeof BatchStatusRowSchema>;
export type BatchStatusInsert = z.infer<typeof BatchStatusInsertSchema>;

