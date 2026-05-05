import { query } from "db";
import type { QueryResultRow } from "pg";
import type { ZodType } from "zod";

type FieldValuePair = { field: string; value: unknown };

type FieldMap<TInsert> = Record<keyof TInsert & string, string>;

export abstract class Repository<T, TRow extends QueryResultRow, TLookup extends Record<string, unknown>, TInsert> {
  protected tableName: string;
  protected schema: ZodType<T>;
  protected columns: string[];
  private fieldMap: FieldMap<TInsert>;
  private keys: (keyof TInsert & string)[];

  constructor(tableName: string, schema: ZodType<T>, fieldMap: FieldMap<TInsert>) {
    this.tableName = tableName;
    this.schema = schema;
    this.fieldMap = fieldMap;
    this.keys = Object.keys(fieldMap) as (keyof TInsert & string)[];
    this.columns = this.keys.map((k) => fieldMap[k]);
  }

  protected toValues(data: TInsert): unknown[] {
    return this.keys.map((key) => data[key]);
  }

  protected toPartialFieldValues(data: Partial<TInsert>): FieldValuePair[] {
    return this.keys.filter((key) => key in data).map((key) => ({ field: this.fieldMap[key], value: data[key] }));
  }

  private placeholders(): string {
    return this.columns.map((_, i) => `$${i + 1}`).join(", ");
  }

  private multiRowPlaceholders(rowCount: number): string {
    const n = this.columns.length;
    return Array.from(
      { length: rowCount },
      (_, row) => `(${this.columns.map((_, col) => `$${row * n + col + 1}`).join(", ")})`,
    ).join(", ");
  }

  private setClause(): string {
    return this.columns.map((col, i) => `${col} = $${i + 2}`).join(", ");
  }

  private partialSetClause(pairs: FieldValuePair[]): string {
    return pairs.map(({ field }, i) => `${field} = $${i + 2}`).join(", ");
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
    const queryText = `INSERT INTO ${this.tableName} (${this.columns.join(", ")}) VALUES (${this.placeholders()}) RETURNING *`;
    const result = await query<TRow>(queryText, this.toValues(data));
    return this.schema.parse(result.rows[0]);
  }

  async createMany(data: TInsert[]): Promise<T[]> {
    const queryText = `INSERT INTO ${this.tableName} (${this.columns.join(", ")}) VALUES(${this.multiRowPlaceholders(data.length)}) RETURNING *`;
    const result = await query<TRow>(
      queryText,
      data.flatMap((item) => this.toValues(item)),
    );
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async update(id: number, data: TInsert): Promise<T> {
    const result = await query<TRow>(`UPDATE ${this.tableName} SET ${this.setClause()} WHERE id = $1 RETURNING *`, [
      id,
      ...this.toValues(data),
    ]);
    const rows = result.rows;
    return this.schema.parse(rows[0]);
  }

  async updateMany(ids: number[], data: TInsert): Promise<T[]> {
    const result = await query<TRow>(
      `UPDATE ${this.tableName} SET ${this.setClause} WHERE id = ANY($1::int[]) RETURNING *`,
      [ids, ...this.toValues(data)],
    );
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async patch(id: number, data: Partial<TInsert>): Promise<T> {
    const pairs = this.toPartialFieldValues(data);
    if (pairs.length === 0) throw new Error("patch() called with no fields");

    const result = await query<TRow>(
      `UPDATE ${this.tableName} SET ${this.partialSetClause(pairs)} WHERE id = $1 RETURNING *`,
      [id, ...pairs.map(({ value }) => value)],
    );
    const rows = result.rows;
    return this.schema.parse(rows[0]);
  }

  async patchMany(ids: number[], data: Partial<TInsert>): Promise<T[]> {
    const pairs = this.toPartialFieldValues(data);
    if (pairs.length === 0) throw new Error("patchMany() called with no fields");

    const result = await query<TRow>(
      `UPDATE ${this.tableName} SET ${this.partialSetClause(pairs)} WHERE id = ANY($1::int[]) RETURNING *`,
      [ids, ...pairs.map(({ value }) => value)],
    );
    const rows = result.rows;
    return this.schema.array().parse(rows);
  }

  async delete(id: number): Promise<T> {
    const result = await query<TRow>(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return this.schema.parse(rows[0]);
  }

  async deleteMany(ids: number[]): Promise<T[]> {
    const result = await query<TRow>(`DELETE FROM ${this.tableName} WHERE id = ANY($1::int[]) RETURNING *`, [ids]);
    return this.schema.array().parse(result.rows);
  }
}
