import { query } from "db";
import { type Role, RoleFromRow, type RoleInsert, type RoleRow } from "schemas/roles";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";

export class RoleRepository {
  async findMany(): Promise<Role[]> {
    const result = await query<RoleRow>(`SELECT * FROM roles`);
    const rows = result.rows;
    return RoleFromRow.array().parse(rows);
  }

  async find(id: number): Promise<Role> {
    const result = await query<RoleRow>(`SELECT * FROM roles WHERE id = $1 LIMIT 1`, [id]);
    const rows = result.rows;
    return RoleFromRow.parse(rows[0]);
  }
  
  async create(data: RoleInsert): Promise<Role> {
    const result = await query<RoleRow>(`INSERT INTO roles (label, can_override_workflow, is_active) VALUES($1, $2, $3)`, [data.label, data.canOverrideWorkflow, data.isActive]);
    const rows = result.rows;
    return RoleFromRow.parse(rows[0]);
  }

  async createMany(data: RoleInsert[]): Promise<Role[]> {
    const { placeholders, values } = buildValuesPlaceholders<RoleInsert>(data, item => [item.label, item.canOverrideWorkflow, item.isActive])
    const result = await query<RoleRow>(`INSERT INTO roles (label, can_override_worklfow, is_active) VALUES ${placeholders}`, [values]);
    const rows = result.rows;
    return RoleFromRow.array().parse(rows);
  }

  async update(id: number, data: RoleInsert): Promise<Role> {
    const result = await query<RoleRow>(`UPDATE roles SET label = $2, can_override_workflow = $3, is_active = $4 WHERE id = $1 RETURNING *`, [id, data.label, data.canOverrideWorkflow, data.isActive]);
    const rows = result.rows;
    return RoleFromRow.parse(rows[0]);
  }

  async delete(id: number): Promise<Role> {
    const result = await query<RoleRow>(`DELETE FROM roles WHERE id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return RoleFromRow.parse(rows[0]);
  }
}


