import { z } from "zod";
import { DbId } from "./utils";

const shared = {
  id: DbId,
  code: z.string(),
  name: z.string(),
};

const mapped = {
  measureUnitId: DbId,
  isActive: z.boolean().default(true),
};

export const ProductSchema = z.object({ ...shared, ...mapped });

export const ProductRowSchema = z.object({
  ...shared,
  measure_unit_id: mapped.measureUnitId,
  is_active: mapped.isActive,
});

export const ProductFromRow = ProductRowSchema.transform((db) => {
  const { is_active, measure_unit_id, ...rest } = db;
  return {
    ...rest,
    measureUnitId: db.measure_unit_id,
    isActive: db.is_active,
  };
});

export const ProductInsertSchema = ProductSchema.omit({ id: true });

export type Product = z.infer<typeof ProductSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type ProductInsert = z.infer<typeof ProductInsertSchema>;
