import { z } from "zod";
import { DbId } from "schemas/utils";
import { MeasureUnitSchema } from "features/measureUnits/measureUnit.schema";

const shared = {
  id: DbId,
  code: z.string(),
  name: z.string(),
  quantity: z.int().min(0).default(0),
};

const mapped = {
  isActive: z.boolean().default(true),
  boxSize: z.int().positive().default(60),
  barCode: z.string().nullish(),
};

const relations = {
  measureUnit: z.object({
    id: MeasureUnitSchema.shape.id,
    label: MeasureUnitSchema.shape.label.nullish(),
    isActive: MeasureUnitSchema.shape.isActive.nullish(),
  }),
};

export const ProductSchema = z.object({ ...shared, ...mapped, ...relations }).meta({ id: "Product" });

export const ProductRowSchema = z.object({
  ...shared,
  measure_unit_id: relations.measureUnit.shape.id,
  measure_unit_label: relations.measureUnit.shape.label,
  measure_unit_is_active: relations.measureUnit.shape.isActive,
  is_active: mapped.isActive,
  box_size: mapped.boxSize,
  bar_code: mapped.barCode,
});

export const ProductFromRow = ProductRowSchema.transform((db) => {
  const { is_active, box_size, bar_code, measure_unit_id, measure_unit_label, measure_unit_is_active, ...rest } = db;
  return {
    ...rest,
    measureUnit: {
      id: measure_unit_id,
      label: measure_unit_label,
      isActive: measure_unit_is_active,
    },
    isActive: db.is_active,
    boxSize: box_size,
    barCode: bar_code,
  };
});

export const ProductInsertSchema = ProductSchema.omit({ id: true })
  .partial({ measureUnit: true, isActive: true, quantity: true })
  .meta({ id: "ProductInsert" });

export const ProductPatchSchema = ProductSchema.omit({ id: true })
  .partial()
  .extend({ quantity: z.int().min(0).optional(),  })
  .meta({ id: "ProductPatch" });


export const ProductLookupSchema = z.union([z.object({ id: z.number().positive() }), z.object({ code: z.string() })]);

export type Product = z.infer<typeof ProductSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type ProductInsert = z.infer<typeof ProductInsertSchema>;
export type ProductPatch = z.infer<typeof ProductPatchSchema>;
export type ProductLookup = z.infer<typeof ProductLookupSchema>;
