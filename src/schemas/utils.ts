import { z } from "zod";

export const emptyToNull = z
  .string()
  .transform((val) => (val.trim() === "" ? null : val));

export const dateOrNull = z.string().transform((val) => {
  if (!val || val.trim() === "") return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
});

export const DbId = z.int().positive();

export const Timestamps = {
  updatedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
};

export const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bulkOperationSchema = z.object({
  ids: z.array(z.int().positive()).min(1)
})
