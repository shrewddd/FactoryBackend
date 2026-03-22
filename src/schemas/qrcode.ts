import { z } from "zod";
import { DbId } from "./utils";

const shared = {
  id: DbId,
  name: z.string().nullish(),
  resource: z.string().nullish(),
};

const mapped = {
  isTaken: z.boolean().default(false),
  isActive: z.boolean().default(true),
};

export const QRCodeSchema = z.object({ ...shared, ...mapped });

export const QRCodeRowSchema = z.object({
  ...shared,
  is_taken: mapped.isTaken,
  is_active: mapped.isActive,
});

export const QRCodeFromRow = QRCodeRowSchema.transform((db) => {
  const { is_taken, is_active, ...rest } = db;
  return {
    ...rest,
    isTaken: db.is_taken,
    isActive: db.is_active,
  };
});

export const QRCodeInsertSchema = QRCodeSchema.omit({ id: true, isTaken: true }).partial({isActive: true});

export const QRCodeInitialzieSchema = QRCodeInsertSchema
.extend({ amount: z.int().positive() })
.transform(({ amount, ...qrcode }) => ({
    qrcode,
    amount,
  }),
);

export const QRCodeLinkSchema = z.object({
  resource: z.string(),
});

export type QRCode = z.infer<typeof QRCodeSchema>;
export type QRCodeRow = z.infer<typeof QRCodeRowSchema>;
export type QRCodeInsert = z.infer<typeof QRCodeInsertSchema>;
export type QRCodeInitialize = z.infer<typeof QRCodeInitialzieSchema>
export type QRCodeLink = z.infer<typeof QRCodeLinkSchema>
