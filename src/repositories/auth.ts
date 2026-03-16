import { query } from "db";
import { type Authentication, AuthenticationFromRow, type AuthenticationInsert, type AuthenticationRow } from "schemas/authentication";

export class AuthenticationRepository {
  async find(id: number): Promise<Authentication> {
    const result = await query<AuthenticationRow>(`SELECT * FROM authentication WHERE user_id = $1 LIMIT 1`, [id]);
    const rows = result.rows;
    return AuthenticationFromRow.parse(rows[0]);
  }
  
  async create(data: AuthenticationInsert): Promise<Authentication> {
    const result = await query<AuthenticationRow>(`INSERT INTO authentication (user_id, hash, salt) VALUES($1, $2, $3) RETURNING *`, [data.userId, data.hash, data.salt]);
    const rows = result.rows;
    return AuthenticationFromRow.parse(rows[0]);
  }

  async update(id: number, data: AuthenticationInsert): Promise<Authentication> {
    const result = await query<AuthenticationRow>(`UPDATE authentication SET hash = $2, salt = $3 WHERE user_id = $1 RETURNING *`, [id, data.hash, data.salt])
    const rows = result.rows;
    return AuthenticationFromRow.parse(rows[0]);
  }

  async delete(id: number): Promise<Authentication> {
    const result = await query<AuthenticationRow>(`DELETE FROM authentication WHERE user_id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return AuthenticationFromRow.parse(rows[0]);
  }
}


