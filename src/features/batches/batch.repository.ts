import { Repository } from "abstract/repository";
import { BatchFromRow, type Batch, type BatchInsert, type BatchLookup, type BatchRow } from "./batch.schema";
import { query } from "db";
import { BATCH_BASE_SELECT, FIND_ACTIVE_BY_WORKER_QUERY, FIND_ALL_BATCHES_QUERY } from "./batch.queries";
import type { FieldMap } from "abstract/types";

const fieldMap: FieldMap<BatchInsert> = {
  name: "name",
  size: "size",
  isActive: "is_active",
  product: { column: "product_id", extract: (d) => d.product?.id ?? null },
  workstation: { column: "workstation_id", extract: (d) => d.workstation?.id ?? null },
  status: { column: "status_id", extract: (d) => d.status?.id ?? null },
};

export class BatchRepository extends Repository<Batch, BatchRow, BatchLookup, BatchInsert> {
  constructor() {
    super("batches", BatchFromRow, fieldMap);
  }

  async find(by: BatchLookup): Promise<Batch | null> {
    const [key, value] = Object.entries(by)[0] ?? [];
    if (!key || value === undefined) throw new Error("Invalid lookup");

    const def = this.lookupMap[key as keyof BatchLookup];
    if (!def) throw new Error(`No lookup mapping for "${key}"`);

    const column = typeof def === "string" ? def : def.column;
    const param = typeof def === "string" ? value : def.extract(value as never);

    const result = await query<BatchRow>(
      `${BATCH_BASE_SELECT} WHERE b.${column} = $1 LIMIT 1`,
      [param]
    );

    return result.rows[0] ? BatchFromRow.parse(result.rows[0]) : null;
  }

  async findMany(): Promise<Batch[]> {
    const result = await query<BatchRow>(BATCH_BASE_SELECT);
    return BatchFromRow.array().parse(result.rows);
  }

  async findManyWithAll(): Promise<Batch[]> {
    const result = await query<BatchRow>(FIND_ALL_BATCHES_QUERY);
    const parsed = result.rows.map((row) => BatchFromRow.parse(row));
    return parsed;
  }

  async findActiveByWorker(actorId: number): Promise<Batch[]> {
    const result = await query<BatchRow>(FIND_ACTIVE_BY_WORKER_QUERY, [actorId]);
    return BatchFromRow.array().parse(result.rows);
  }
}
