import { query } from "db";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";
import { type Workstation, type WorkstationInsert, type WorkstationRow, WorkstationFromRow } from "schemas/workstations";

export class WorkstationRepository {
  async findMany(): Promise<Workstation[]> {
    const result = await query<WorkstationRow>(`SELECT * FROM workstations`);
    const rows = result.rows;
    return WorkstationFromRow.array().parse(rows)
  }

  async find(id: number): Promise<Workstation> {
    const result = await query<WorkstationRow>(`SELECT * FROM workstation WHERE id = $1 LIMIT 1`, [id]);
    const rows = result.rows;
    return WorkstationFromRow.parse(rows[0])
  }

  async create(data: WorkstationInsert): Promise<Workstation> {
    const result = await query<WorkstationRow>(`INSERT INTO workstations (name, qr_code_id, is_active) VALUES($1, $2, $3) RETURNING *`, [data.name, data.qrCodeId, data.isActive])
    const rows = result.rows;
    return WorkstationFromRow.parse(rows[0]);
  }

  async createMany(data: WorkstationInsert[]): Promise<Workstation[]> {
    const  { placeholders, values } = buildValuesPlaceholders<WorkstationInsert>(data, workstation => [workstation.name, workstation.qrCodeId, workstation.isActive])
    const result = await query<WorkstationRow>(`INSERT INTO workstations (name, qr_code_id, is_active) VALUES ${placeholders} RETURNING *`, values)
    const rows = result.rows;
    return WorkstationFromRow.array().parse(rows);
  }

  async update(id: number, data: WorkstationInsert): Promise<Workstation> {
    const result = await query<WorkstationRow>(
      `UPDATE workstations SET name = $2, qr_code_id = $3, is_active = $4 WHERE id = $1 RETURNING *`,
      [id, data.name, data.qrCodeId, data.isActive],
    );
    const rows = result.rows;
    return WorkstationFromRow.parse(rows[0]);
  }

  async delete(id: number): Promise<Workstation> {
    const result = await query<WorkstationRow>(`DELETE FROM workstations WHERE id = $1`, [id]);
    const rows = result.rows;
    return WorkstationFromRow.parse(rows[0]);
  }
}

