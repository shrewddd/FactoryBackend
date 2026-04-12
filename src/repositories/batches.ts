import { query, transaction } from "db";
import { BatchFromRow, type Batch, type BatchInsert, type BatchRow } from "schemas/batches";

export class BatchRepository {
  private readonly WITH_ALL_QUERY = `
  SELECT
    b.*,
    p.name                         AS product_name,
    p.measure_unit_id              AS product_measure_unit_id,
    w.name                         AS workstation_name,
    bs.label                       AS status_label,
    bs.sort_order                  AS status_sort_order,
    bs.is_terminal                 AS status_is_terminal,
    bs.allows_defect_reporting     AS status_allows_defect_reporting,
    bs.is_active                   AS status_is_active,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'department', JSON_BUILD_OBJECT(
            'id',    d.id,
            'label', d.label
          ),
          'worker', JSON_BUILD_OBJECT(
            'id',       u.id,
            'fullName', u.full_name,
            'role',     JSON_BUILD_OBJECT(
              'id',    r.id,
              'label', r.label
            )
          )
        )
      ) FILTER (WHERE bw.id IS NOT NULL),
      '[]'
    ) AS workers
  FROM batches b
  LEFT JOIN products       p  ON p.id  = b.product_id
  LEFT JOIN workstations   w  ON w.id  = b.workstation_id
  LEFT JOIN batch_statuses bs ON bs.id = b.status_id
  LEFT JOIN batch_workers  bw ON bw.batch_id = b.id
  LEFT JOIN departments    d  ON d.id  = bw.department_id
  LEFT JOIN users          u  ON u.id  = bw.worker_id
  LEFT JOIN roles          r  ON r.id  = u.role_id
`;

  async findMany(): Promise<Batch[]> {
    const result = await query<BatchRow>(
      `${this.WITH_ALL_QUERY}
    GROUP BY b.id, p.id, w.id, bs.id`,
    );
    return BatchFromRow.array().parse(result.rows);
  }

  async find(id: number): Promise<Batch | null> {
    const result = await query<BatchRow>(
      `${this.WITH_ALL_QUERY}
    WHERE b.id = $1
    GROUP BY b.id, p.id, w.id, bs.id
    LIMIT 1`,
      [id],
    );

    if (!result.rows[0]) return null;
    return BatchFromRow.parse(result.rows[0]);
  }

  async create(data: BatchInsert): Promise<Batch> {
    const result = await query<BatchRow>(
      `INSERT INTO batches (
        name,
        size,
        actual_size,
        product_id,
        workstation_id,
        status_id,
        planned_for,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.name,
        data.size,
        data.actualSize,
        data.productId,
        data.workstationId,
        data.statusId ?? 1,
        data.plannedFor,
        data.isActive,
      ],
    );
    return BatchFromRow.parse(result.rows[0]);
  }
  // async createMany(data: BatchInsert[]): Promise<Batch[]> {
  //   const { placeholders, values } = buildValuesPlaceholders<BatchInsert>(data, (item) => [item.label, item.isActive]);
  //   const result = await query<BatchRow>(`INSERT INTO departments (label, is_active) VALUES ${placeholders}`, values);
  //   const rows = result.rows;
  //   return BatchFromRow.array().parse(rows);
  // }

  async update(id: number, data: BatchInsert): Promise<Batch> {
    const result = await transaction(async (client) => {
      const { rows } = await client.query<BatchRow>(
        `UPDATE batches SET
        name = $2,
        size = $3,
        actual_size = $4,
        product_id = $5,
        workstation_id = $6,
        status_id = $7,
        planned_for = $8,
        is_active = $9
      WHERE id = $1
      RETURNING *`,
        [
          id,
          data.name,
          data.size,
          (data.statusId ?? 1) === 1 ? data.size : data.actualSize,
          data.productId,
          data.workstationId,
          data.statusId,
          data.plannedFor,
          data.isActive,
        ],
      );

      if (!rows[0]) throw new Error(`Batch ${id} not found`);

      if (data.workers?.length) {
        await client.query(`DELETE FROM batch_workers WHERE batch_id = $1`, [id]);

        const values = data.workers.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(", ");

        const params = data.workers.flatMap((w) => [w.department.id, w.worker.id]);

        await client.query(
          `INSERT INTO batch_workers (batch_id, department_id, worker_id)
        VALUES ${values}`,
          [id, ...params],
        );
      }

      return rows[0];
    });

    return BatchFromRow.parse(result);
  }

  async softDelete(id: number): Promise<Batch> {
    const result = await query<BatchRow>(`DELETE FROM batches WHERE id = $1 RETURNING *`, [id]);
  }

  async delete(id: number): Promise<Batch> {
    const result = await query<BatchRow>(`DELETE FROM batches WHERE id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return BatchFromRow.parse(rows[0]);
  }

  async advance(
    batchId: number, 
    actorId: number,
    defects: { defect_type_id: number; quantity: number}[],
    sizeOverride?: number,
  ): Promise<Batch> {
    const result = await query<BatchRow>(
      `SELECT * FROM advance_batch($1, $2, $3::jsonb, $4)`,
      [batchId, actorId, JSON.stringify(defects), sizeOverride ?? null],
    );
    if (!result.rows[0]) throw new Error(`Scan rejected for batch ${batchId}`);
    return BatchFromRow.parse(result.rows[0]);
  }
}
