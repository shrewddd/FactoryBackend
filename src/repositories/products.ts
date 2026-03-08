import { query } from "db";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";
import { type Product, type ProductRow, type ProductInsert, ProductFromRow } from "schemas/products";

export class ProductRepository {

  async find(id: number): Promise<Product> {
    const result = await query<ProductRow>(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [id]);
    const rows = result.rows;
    return ProductFromRow.parse(rows)
  }

  async findMany(): Promise<Product[]> {
    const result = await query<ProductRow>(`SELECT * FROM products`);
    const rows = result.rows;
    return ProductFromRow.array().parse(rows)
  }

  async create(data: ProductInsert): Promise<Product> {
    const result = await query<ProductRow>(`INSERT INTO products (code, name, measure_unit_id, is_active) VALUES($1, $2, $3, $4)`, [data.code, data.name, data.measureUnitId, data.isActive])
    const rows = result.rows;
    return ProductFromRow.parse(rows);
  }

  async createMany(data: ProductInsert[]): Promise<Product[]> {
    const { placeholders, values } = buildValuesPlaceholders<ProductInsert>(data, products => [products.code, products.name, products.measureUnitId, products.isActive])
    const result = await query<ProductRow>(`INSERT INTO products (code, name, measure_unit_id, is_active) VALUES ${placeholders}`, values)
    const rows = result.rows;
    return ProductFromRow.array().parse(rows);
  }

  async update(id: number, data: ProductInsert): Promise<Product> {
    const result = await query<ProductRow>(
      `UPDATE products SET code = $2, name = $3, measure_unit_id = $4, is_active = $5 WHERE id = $1 RETURNING *`,
      [id, data.code, data.name, data.measureUnitId, data.isActive],
    );
    const rows = result.rows;
    return ProductFromRow.parse(rows[0]);
  }

  async delete(id: number): Promise<Product> {
    const result = await query<ProductRow>(`DELETE FROM products WHERE id = $1`, [id]);
    const rows = result.rows;
    return ProductFromRow.parse(rows[0]);
  }
}
