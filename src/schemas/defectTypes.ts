import z from "zod";
import { DbId } from "./utils";

const defectTypeEnum = z.enum(["second_grade", "spoilage"]);

const shared = {
  id: DbId,
  label: z.string(),
  category: defectTypeEnum.default("second_grade"),
};

const mapped = {
  sortOrder: z.int().positive().default(0),
  isActive: z.boolean().default(true),
};

export const DefectTypeSchema = z.object({ ...shared, ...mapped });

export const DefectTypeRowSchema = z.object({
  ...shared,
  sort_order: mapped.sortOrder,
  is_active: mapped.isActive,
});

export const DefetTypeInsertSchema = DefectTypeRowSchema.omit({id: true})

export const DefectTypeFromRow = DefectTypeRowSchema.transform((row) => {
  const { is_active, sort_order, ...rest } = row;
  return {
    ...rest,
    sortOrder: sort_order,
    isActive: is_active,
  };
});

export type DefectType = z.infer<typeof DefectTypeSchema>
export type DefectTypeRow = z.infer<typeof DefectTypeRowSchema>
export type DefectTypeInsert = z.infer<typeof DefetTypeInsertSchema>
