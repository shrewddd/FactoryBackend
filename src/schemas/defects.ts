
import z from "zod";
import { DbId } from "./utils";

const shared = {
  id: DbId,
  quantity: z.int().positive(), 
};

const mapped = {
  batchId: DbId,
  batchStatusId: DbId,
  defectTypeId: DbId,
};

export const DefectSchema = z.object({ ...shared, ...mapped });

export const DefectRowSchema = z.object({
  ...shared,
  batch_id: mapped.batchId,
  batch_status_id: mapped.batchStatusId,
  defect_type_id: mapped.defectTypeId
});

export const DefectInsertSchema = DefectRowSchema.omit({id: true})

export const DefectFromRow = DefectRowSchema.transform((row) => {
  const { batch_id, batch_status_id, defect_type_id, ...rest } = row;
  return {
    ...rest,
    batchId: batch_id,
    batchStatusId: batch_status_id,
    defectTypeId: defect_type_id,
  };
});

export type Defect = z.infer<typeof DefectSchema>
export type DefectRow = z.infer<typeof DefectRowSchema>
export type DefectInsert = z.infer<typeof DefectInsertSchema>
