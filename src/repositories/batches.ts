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

  async findManyPacked() {
    const result = await query<{ product_id: number; product_name: string; quantity: number }>(
      `SELECT ps.product_id, p.name AS product_name, ps.quantity
       FROM packed_stock ps
       JOIN products p ON p.id = ps.product_id`,
    );
    return result.rows;
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

  // async softDelete(id: number): Promise<Batch> {
  //   const result = await query<BatchRow>(`DELETE FROM batches WHERE id = $1 RETURNING *`, [id]);
  // }

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

  async newAdvance(
    batchId: number,
    actorId: number,
    defects: { defect_type_id: number; quantity: number }[],
    sizeOverride?: number,
  ): Promise<Batch> {
    return transaction(async (client) => {

      // 1. Load batch + its transition in one shot
      const { rows: [ctx] } = await client.query<{
        status_id: number;
        actual_size: number;
        is_terminal: boolean;
        to_status_id: number | null;
        required_department_id: number | null;
        required_role_id: number | null;
        actor_role_id: number;
        can_override: boolean;
        in_required_dept: boolean;
      }>(
        `SELECT
          b.status_id,
          b.actual_size,
          bs.is_terminal,
          st.to_status_id,
          st.required_department_id,
          st.required_role_id,
          u.role_id               AS actor_role_id,
          r.can_override_workflow AS can_override,
          EXISTS (
            SELECT 1 FROM user_departments ud
            WHERE ud.user_id = $2
              AND ud.department_id = st.required_department_id
          )                       AS in_required_dept
        FROM batches b
        JOIN batch_statuses   bs ON bs.id = b.status_id
        LEFT JOIN status_transitions st ON st.from_status_id = b.status_id
        JOIN users            u  ON u.id = $2 AND u.is_active = TRUE
        JOIN roles            r  ON r.id = u.role_id
        WHERE b.id = $1 AND b.is_active = TRUE`,
        [batchId, actorId],
      );

      if (!ctx) {
        throw new Error(`Batch ${batchId} not found or actor ${actorId} is inactive`);
      }

      // 2. Guard: terminal batches can't advance
      if (ctx.is_terminal) {
        throw new Error(`Batch ${batchId} is already in a terminal status`);
      }

      // 3. Guard: transition must exist
      if (!ctx.to_status_id) {
        throw new Error(`No transition defined from current status of batch ${batchId}`);
      }

      // 4. Permission check
      const hasPermission =
        ctx.can_override ||
        (ctx.required_role_id !== null && ctx.actor_role_id === ctx.required_role_id) ||
        (ctx.required_department_id !== null && ctx.in_required_dept);

      if (!hasPermission) {
        throw new Error(`Actor ${actorId} is not permitted to advance batch ${batchId}`);
      }

      // 5. Optional size override (must happen before defect subtraction)
      if (sizeOverride !== undefined) {
        await client.query(
          `UPDATE batches SET actual_size = $2 WHERE id = $1`,
          [batchId, sizeOverride],
        );
        ctx.actual_size = sizeOverride;
      }

      // 6. Validate defects don't exceed actual size
      const totalDefects = defects.reduce((sum, d) => sum + d.quantity, 0);
      if (totalDefects > ctx.actual_size) {
        throw new Error(
          `Total defects (${totalDefects}) exceed actual size (${ctx.actual_size}) for batch ${batchId}`,
        );
      }

      // 7. Subtract defects and advance status atomically
      const { rows: [updatedRow] } = await client.query<BatchRow>(
        `UPDATE batches
         SET actual_size = actual_size - $2,
             status_id   = $3
         WHERE id = $1
         RETURNING *`,
        [batchId, totalDefects, ctx.to_status_id],
      );

      // 8. Insert defect records
      if (defects.length > 0) {
        const defectValues = defects
          .filter((d) => d.quantity > 0)
          .map((_, i) => `($1, $2, $${i * 2 + 3}, $${i * 2 + 4})`)
          .join(", ");

        const defectParams = defects
          .filter((d) => d.quantity > 0)
          .flatMap((d) => [d.defect_type_id, d.quantity]);

        await client.query(
          `INSERT INTO defects (batch_id, batch_status_id, defect_type_id, quantity)
           VALUES ${defectValues}`,
          [batchId, ctx.status_id, ...defectParams],
        );
      }

      // 9. Record the worker for department-based transitions
      if (ctx.required_department_id !== null) {
        await client.query(
          `INSERT INTO batch_workers (batch_id, department_id, worker_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (batch_id, department_id) DO NOTHING`,
          [batchId, ctx.required_department_id, actorId],
        );
      }

      // 10. Audit trail
      await client.query(
        `INSERT INTO batch_transitions (batch_id, from_status_id, to_status_id, actor_id)
         VALUES ($1, $2, $3, $4)`,
        [batchId, ctx.status_id, ctx.to_status_id, actorId],
      );

      return BatchFromRow.parse(updatedRow);
    });
  }

async packBatch(
  batchId: number,
  actorId: number,
  remain: number,
  defects: { defect_type_id: number; quantity: number }[],
): Promise<Batch> {
  return transaction(async (client) => {

    const { rows: [batch] } = await client.query<{
      actual_size: number;
      status_id: number;
      status_label: string;
      product_id: number;
    }>(
      `SELECT b.actual_size, b.status_id, b.product_id, bs.label AS status_label
       FROM batches b
       JOIN batch_statuses bs ON bs.id = b.status_id
       WHERE b.id = $1 AND b.is_active = TRUE`,
      [batchId],
    );

    if (!batch) throw new Error(`Batch ${batchId} not found`);
    if (batch.status_label !== "Packaging Workshop (In-Progress)") {
      throw new Error(`Batch ${batchId} is not in packaging`);
    }

    const totalDefects = defects.reduce((sum, d) => sum + d.quantity, 0);
    const quantityPacked = batch.actual_size - totalDefects - remain;

    if (quantityPacked <= 0) {
      throw new Error(`Nothing to pack: check remain and defect values`);
    }

    // Defects
    if (defects.some((d) => d.quantity > 0)) {
      const filtered = defects.filter((d) => d.quantity > 0);
      const defectValues = filtered
        .map((_, i) => `($1, $2, $${i * 2 + 3}, $${i * 2 + 4})`)
        .join(", ");
      const defectParams = filtered.flatMap((d) => [d.defect_type_id, d.quantity]);

      await client.query(
        `INSERT INTO defects (batch_id, batch_status_id, defect_type_id, quantity)
         VALUES ${defectValues}`,
        [batchId, batch.status_id, ...defectParams],
      );
    }

    // Always add packed quantity to stock — both paths
    await client.query(
      `INSERT INTO packed_stock (product_id, quantity)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE
       SET quantity = packed_stock.quantity + EXCLUDED.quantity`,
      [batch.product_id, quantityPacked],
    );

    if (remain === 0) {
      const { rows: [completedStatus] } = await client.query<{ id: number }>(
        `SELECT id FROM batch_statuses WHERE label = 'Completed'`,
      );

      const { rows: [updated] } = await client.query<BatchRow>(
        `UPDATE batches
         SET actual_size = 0,
             status_id   = $2
         WHERE id = $1
         RETURNING *`,
        [batchId, completedStatus.id],
      );

      await client.query(
        `INSERT INTO batch_transitions (batch_id, from_status_id, to_status_id, actor_id)
         VALUES ($1, $2, $3, $4)`,
        [batchId, batch.status_id, completedStatus.id, actorId],
      );

      return BatchFromRow.parse(updated);
    } else {
      const { rows: [labelingFinished] } = await client.query<{ id: number }>(
        `SELECT id FROM batch_statuses WHERE label = 'Labeling Workshop (Finished)'`,
      );

      const { rows: [updated] } = await client.query<BatchRow>(
        `UPDATE batches
         SET actual_size = $2,
             status_id   = $3
         WHERE id = $1
         RETURNING *`,
        [batchId, remain, labelingFinished.id],
      );

      await client.query(
        `INSERT INTO batch_transitions (batch_id, from_status_id, to_status_id, actor_id)
         VALUES ($1, $2, $3, $4)`,
        [batchId, batch.status_id, labelingFinished.id, actorId],
      );

      return BatchFromRow.parse(updated);
    }
  });
}
}
