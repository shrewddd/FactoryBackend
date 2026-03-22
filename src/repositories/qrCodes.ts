import { QRCodeFromRow, type QRCode, type QRCodeInsert, type QRCodeRow } from "schemas/qrcode";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";
import { query } from "db";

export class QRCodeRepository {
  async findMany(): Promise<QRCode[]> {
    const result = await query<QRCodeRow>(`SELECT * FROM qr_codes`);
    const rows = result.rows;
    return QRCodeFromRow.array().parse(rows)
  }

  async find(id: number): Promise<QRCode> {
    const result = await query<QRCodeRow>(`SELECT * FROM qr_codes WHERE id = $1 LIMIT 1`, [id]);
    const rows = result.rows;
    return QRCodeFromRow.parse(rows[0])
  }

  async create(data: QRCodeInsert): Promise<QRCode> {
    const result = await query<QRCodeRow>(`INSERT INTO qr_codes (name, resource, is_active) VALUES($1, $2, $3) RETURNING *`, [data.name, data.resource, data.isActive])
    const rows = result.rows;
    return QRCodeFromRow.parse(rows[0]);
  }

  async createMany(data: QRCodeInsert[]): Promise<QRCode[]> {
    const  { placeholders, values } = buildValuesPlaceholders<QRCodeInsert>(data, qr => [qr.name, qr.resource, qr.isActive])
    const result = await query<QRCodeRow>(`INSERT INTO qr_codes (name, resource, is_active) VALUES ${placeholders} RETURNING *`, values)
    const rows = result.rows;
    return QRCodeFromRow.array().parse(rows);
  }

  async update(id: number, data: QRCodeInsert): Promise<QRCode> {
    const result = await query<QRCodeRow>(
      `UPDATE qr_codes SET name = $2, resource = $3, is_active = $4 WHERE id = $1 RETURNING *`,
      [id, data.name, data.resource, data.isActive],
    );
    const rows = result.rows;
    return QRCodeFromRow.parse(rows[0]);
  }

  async delete(id: number): Promise<QRCode> {
    const result = await query<QRCodeRow>(`DELETE FROM qr_codes WHERE id = $1`, [id]);
    const rows = result.rows;
    return QRCodeFromRow.parse(rows[0]);
  }

  async link(id: number, resource: string) {
    const result = await query(`UPDATE qr_codes SET resource = $2 WHERE id = $1 RETURNING *`, [id, resource])
    const rows = result.rows;
    return QRCodeFromRow.parse(rows[0]);
  }
}
