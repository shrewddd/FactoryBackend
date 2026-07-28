import { z } from "zod";
import { BatchStatusSchema } from "features/batchStatuses/batchStatus.schema";
import { ProductSchema } from "features/products/product.schema";

const relations = {
  milestone: z.object({
    id: BatchStatusSchema.shape.id,
    label: BatchStatusSchema.shape.label,
    isInventoryMilestone: BatchStatusSchema.shape.isInventoryMilestone,
    quantity: z.number(),
  }),
  product: z.object({
    id: ProductSchema.shape.id,
    name: ProductSchema.shape.name,
    barCode: ProductSchema.shape.barCode,
  }),
};

export const ProductQuantitiesByMilestoneSchema = z.object({
  product: relations.product,
  milestones: z.array(relations.milestone),
  readyQuantity: z.number(),
  storageQuantity: z.number(),
  totalQuantity: z.number(),
}).meta({ id: "ProductQuantitiesByMilestone" });

const MilestoneSumRowSchema = z.object({
  milestoneId: relations.milestone.shape.id,
  milestoneLabel: relations.milestone.shape.label,
  isInventoryMilestone: relations.milestone.shape.isInventoryMilestone,
  quantity: z.number(),
});

export const ProductQuantitiesByMilestoneRowSchema = z.object({
  product_id: relations.product.shape.id,
  product_name: relations.product.shape.name,
  product_bar_code: relations.product.shape.barCode,
  milestone_sums: z.array(MilestoneSumRowSchema),
  ready_quantity: z.number(),
  storage_quantity: z.coerce.number(),
  total_quantity: z.coerce.number(),
});

export const ProductQuantitiesByMilestoneFromRow = ProductQuantitiesByMilestoneRowSchema.transform((row) => ({
  product: {
    id: row.product_id,
    name: row.product_name,
    barCode: row.product_bar_code,
  },
  milestones: row.milestone_sums.map((m) => ({
    id: m.milestoneId,
    label: m.milestoneLabel,
    isInventoryMilestone: m.isInventoryMilestone,
    quantity: m.quantity,
  })),
  readyQuantity: row.ready_quantity,
  storageQuantity: row.storage_quantity,
  totalQuantity: row.total_quantity,
}));

export type ProductQuantitiesByMilestoneRow = z.infer<typeof ProductQuantitiesByMilestoneRowSchema>;
export type ProductQuantitiesByMilestone = z.infer<typeof ProductQuantitiesByMilestoneFromRow>;
