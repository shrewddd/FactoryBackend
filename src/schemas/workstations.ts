import { z } from "zod";
import { DbId } from "./utils";

const shared = {
  id: DbId,
  name: z.string(),
};

const mapped = {
  qrCodeId: DbId.nullish(),
  isActive: z.boolean().default(true),
};

export const WorkstationSchema = z.object({ ...shared, ...mapped });

export const WorkstationRowSchema = z.object({
  ...shared,
  qr_code_id: mapped.qrCodeId,
  is_active: mapped.isActive,
});

export const WorkstationFromRow = WorkstationRowSchema.transform((row) => {
  const { qr_code_id, is_active, ...rest } = row;
  return {
    ...rest,
    qrCodeId: qr_code_id,
    isActive: is_active,
  };
});

export const WorkstationInsertSchema = WorkstationSchema.omit({ id: true }).partial({ isActive: true });

export type Workstation = z.infer<typeof WorkstationSchema>;
export type WorkstationRow = z.infer<typeof WorkstationRowSchema>;
export type WorkstationInsert = z.infer<typeof WorkstationInsertSchema>;
