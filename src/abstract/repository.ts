import { query } from "db";
import type { QueryResultRow } from "pg";
import type { ZodType } from "zod";

export abstract class Repository<T, TRow extends QueryResultRow, TLookup extends Record<string, unknown>, TInsert> {
  protected tableName: string;
  protected schema: ZodType<T>;
  protected fields: string[];

  constructor(tableName: string, schema: ZodType<T>, fields: string[]) {
    this.tableName = tableName;
    this.schema = schema;
    this.fields = fields;
  }

  protected abstract toValues(data: TInsert): unknown[];

  protected toMultipleValues(data: TInsert[]): unknown[] {
    const values = [];
    for (const item of data) values.push(this.toValues(item));
    return values;
  }

  protected placeholders(): string {
    return this.fields.map((_, i) => `$${i + 1}`).join(", ");
  }

  async find(by: TLookup): Promise<T | null> {
    const [field, value] = Object.entries(by)[0] ?? [];
    if (!field || value === undefined) throw new Error("Invalid lookup");

    const result = await query<TRow>(`SELECT * FROM ${this.tableName} WHERE ${field} = $1 LIMIT 1`, [value]);
    const rows = result.rows;

    if (!rows[0]) return null;
    return this.schema.parse(rows[0]);
  }

  async findMany(): Promise<T[]> {
    const result = await query<TRow>(`SELECT * FROM ${this.tableName}`);
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async create(data: TInsert): Promise<T> {
    const queryText = `INSERT INTO ${this.tableName} (${this.fields.join(", ")}) VALUES (${this.placeholders()}) RETURNING *`;
    const result = await query<TRow>(queryText, this.toValues(data));
    return this.schema.parse(result.rows[0]);
  }

  async createMany(data: TInsert[]): Promise<T[]> {
    const queryText = `INSERT INTO ${this.tableName} (${this.fields.join(", ")}) VALUES(${this.placeholders()}) RETURNING *`;
    const result = await query<TRow>(queryText, this.toMultipleValues(data));
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async update(id: number, data: TInsert): Promise<T> {
    const result = await query<TRow>(`UPDATE ${this.tableName} SET ${this.fields.map((item, i) => (`${item} = $${i + 2}`))} WHERE id = $1 RETURNING *`, [id, ...this.toValues(data)]);
    const rows = result.rows;
    return this.schema.parse(rows);
  }

  async updateMany(ids: number[], data: TInsert): Promise<T[]> {
    const result = await query<TRow>(`UPDATE ${this.tableName} SET ${this.fields.map((item, i) => (`${item} = $${i + 2}`))} WHERE id = ANY($1::int[]) RETURNING *`, [ids, ...this.toValues(data)]);
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async delete(id: number): Promise<T> {
    const result = await query<TRow>(`DELETE FROM ${this.tableName} WHERE id = $1 LIMIT 1 RETURNING *`, [id]);
    const rows = result.rows;
    return this.schema.parse(rows[0]);
  }

  async deleteMany(ids: number[]): Promise<T[]> {
    const result = await query<TRow>(`DELETE FROM ${this.tableName} WHERE id = ANY($1::int[]) RETURNING *`, [ids]);
    return this.schema.array().parse(result.rows);
  }
}
