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

  async findQuantities() {
    const findQuery = `WITH status_quantities AS (
      SELECT
      p.id                    AS product_id,
      p.name                  AS product_name,
      p.measure_unit_id       AS measure_unit_id,
      bs.id                   AS status_id,
      bs.label                AS status_label,
      bs.sort_order           AS status_sort_order,
      bs.is_terminal          AS status_is_terminal,
      COALESCE(SUM(b.actual_size), 0)  AS quantity,
      COUNT(b.id)                      AS batch_count
      FROM products p
      CROSS JOIN batch_statuses bs
      LEFT JOIN batches b       ON  b.product_id = p.id
      AND b.status_id  = bs.id
      AND b.is_active  = TRUE
      WHERE p.is_active  = TRUE
      AND bs.is_active = TRUE
      GROUP BY
      p.id, p.name, p.measure_unit_id,
      bs.id, bs.label, bs.sort_order, bs.is_terminal
      )
      SELECT
      product_id,
      product_name,
      measure_unit_id,
      JSON_AGG(
      JSON_BUILD_OBJECT(
      'status', JSON_BUILD_OBJECT(
      'id',         status_id,
      'label',      status_label,
      'sortOrder',  status_sort_order,
      'isTerminal', status_is_terminal
      ),
      'quantity',   quantity,
      'batchCount', batch_count
      ) ORDER BY status_sort_order
      )                         AS quantity
      FROM status_quantities
      GROUP BY product_id, product_name, measure_unit_id
      HAVING SUM(quantity) > 0
      ORDER BY product_name`;
    const result = await query(findQuery);
    return result.rows;
  }
}
