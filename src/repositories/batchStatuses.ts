import { query } from "db";
import { BatchStatusFromRow, type BatchStatus, type BatchStatusInsert, type BatchStatusRow } from "schemas/batchStatuses";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";

export class BatchStatusRepository {

  async find(id: number): Promise<BatchStatus> {
    const result = await query<BatchStatusRow>(`SELECT * FROM batch_statuses WHERE id = $1`, [id]);
    const rows = result.rows;
    return BatchStatusFromRow.parse(rows)
  }

  async findMany(): Promise<BatchStatus[]> {
    const result = await query<BatchStatusRow>(`SELECT * FROM batch_statuses`);
    const rows = result.rows;
    return BatchStatusFromRow.array().parse(rows)
  }

  async create(data: BatchStatusInsert) {
    const result = await query<BatchStatusRow>(`INSERT INTO batch_statuses (label, sort_order, is_terminal, allows_defect_reporting, is_active) VALUES($1, $2, $3, $4, $5)`, [data.label, data.sortOrder, data.isTerminal, data.isActive, data.allowsDefectReporting])
    const rows = result.rows;
    return BatchStatusFromRow.parse(rows);
  }

  async createMany(data: BatchStatusInsert[]): Promise<BatchStatus[]> {
    const { placeholders, values } = buildValuesPlaceholders<BatchStatusInsert>(data, item => [item.label, item.sortOrder, item.isTerminal, item.allowsDefectReporting, item.isActive])
    const result = await query<BatchStatusRow>(`INSERT INTO batch_statuses (label, sort_order, is_terminal, allows_defect_reporting, is_active) VALUES ${placeholders}`, values);
    const rows = result.rows;
    return BatchStatusFromRow.array().parse(rows);
  }

  async delete(id: number): Promise<BatchStatus> {
    const result = await query<BatchStatusRow>(`DELETE FROM batch_statuses WHERE id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return BatchStatusFromRow.parse(rows[0]);
  }
}
