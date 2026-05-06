import type { QueryResultRow } from "pg";
import type { Repository } from "./repository";

export type Lookup = Record<string, unknown>;

export type BaseRepository<
  T,
  TInsert,
  TLookup extends Lookup,
  TRow extends QueryResultRow = QueryResultRow,
> = Repository<T, TRow, TLookup, TInsert>;

export type FieldValuePair = { field: string; value: unknown };

export type FieldMap<TInsert> = Record<keyof TInsert & string, string>;
