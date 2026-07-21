export const FIND_QUANTITIES_QUERY = `
WITH status_quantities AS (
  SELECT
    bs.id AS status_id,
    bs.label AS status_label,
    bs.sort_order AS status_sort_order,
    bs.is_terminal AS status_is_terminal,
    bs.allows_defect_reporting AS status_allows_defect_reporting,
    bs.is_in_progress AS status_is_in_progress,
    bs.is_finished AS status_is_finished,
    bs.requires_size_input AS status_requires_size_input,
    bs.is_packaging AS status_is_packaging,
    p.id AS product_id,
    p.name AS product_name,
    p.measure_unit_id AS measure_unit_id,
    COALESCE(SUM(b.size), 0) AS quantity,
    COUNT(b.id) AS batch_count
  FROM batch_statuses bs
  CROSS JOIN products p
  LEFT JOIN batches b ON b.product_id = p.id AND b.status_id = bs.id AND b.is_active = TRUE
  WHERE p.is_active = TRUE AND bs.is_active = TRUE
  GROUP BY bs.id, bs.label, bs.sort_order, bs.is_terminal, bs.allows_defect_reporting, bs.is_in_progress, bs.is_finished, bs.requires_size_input, bs.is_packaging, p.id, p.name, p.measure_unit_id
)
SELECT
  status_id,
  status_label,
  status_sort_order,
  status_is_terminal,
  status_allows_defect_reporting,
  status_is_in_progress,
  status_is_finished,
  status_requires_size_input,
  status_is_packaging,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', product_id,
      'name', product_name,
      'measureUnit', JSON_BUILD_OBJECT('id', measure_unit_id),
      'quantity', quantity,
      'batchCount', batch_count
    ) ORDER BY product_name
  ) AS products
FROM status_quantities
WHERE quantity > 0
GROUP BY status_id, status_label, status_sort_order, status_is_terminal, status_allows_defect_reporting, status_is_in_progress, status_is_finished, status_requires_size_input, status_is_packaging
ORDER BY status_sort_order`;

export const FIND_DEFECTS_QUERY = `
SELECT
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(JSON_AGG(
    JSON_BUILD_OBJECT(
      'type', JSON_BUILD_OBJECT('id', dt.id, 'label', dt.label, 'category', dt.category),
      'quantity', totals.total_quantity
    )
    ORDER BY dt.sort_order
  ) FILTER (WHERE dt.id IS NOT NULL), '[]') AS defects
FROM products p
JOIN (
  SELECT b.product_id, d.defect_type_id, SUM(d.quantity) AS total_quantity
  FROM defects d
  JOIN batch_transitions bt ON bt.id = d.transition_id
  JOIN batches b ON b.id = bt.batch_id
  GROUP BY b.product_id, d.defect_type_id
) totals ON totals.product_id = p.id
JOIN defect_types dt ON dt.id = totals.defect_type_id
GROUP BY p.id, p.name
ORDER BY p.name;
`;

export const FIND_INVENTORY_QUERY = `
WITH milestones AS (
  SELECT id, label, sort_order
  FROM batch_statuses
  WHERE is_milestone = TRUE AND is_active = TRUE
),
status_milestone_map AS (
  -- maps every active status to the next milestone status (by sort_order) it belongs to
  SELECT
    bs.id AS status_id,
    m.id AS milestone_id,
    m.label AS milestone_label,
    m.sort_order AS milestone_sort_order
  FROM batch_statuses bs
  JOIN LATERAL (
    SELECT id, label, sort_order
    FROM milestones
    WHERE sort_order >= bs.sort_order
    ORDER BY sort_order ASC
    LIMIT 1
  ) m ON TRUE
  WHERE bs.is_active = TRUE
),
batch_sums AS (
  SELECT
    p.id AS product_id,
    smm.milestone_id,
    smm.milestone_label,
    smm.milestone_sort_order,
    COALESCE(SUM(b.size), 0) AS quantity
  FROM products p
  CROSS JOIN status_milestone_map smm
  LEFT JOIN batches b
    ON b.product_id = p.id
   AND b.status_id = smm.status_id
   AND b.is_active = TRUE
  WHERE p.is_active = TRUE
  GROUP BY p.id, smm.milestone_id, smm.milestone_label, smm.milestone_sort_order
),
storage_sums AS (
  SELECT
    product_id,
    COALESCE(SUM(box_size), 0) AS storage_quantity
  FROM storage_entries
  WHERE written_off_at IS NULL
  GROUP BY product_id
)
SELECT
  p.id AS product_id,
  p.name AS product_name,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'milestoneId', bsu.milestone_id,
      'milestoneLabel', bsu.milestone_label,
      'quantity', bsu.quantity
    ) ORDER BY bsu.milestone_sort_order
  ) AS milestone_sums,
  p.quantity AS ready_quantity,
  COALESCE(ss.storage_quantity, 0) AS storage_quantity,
  SUM(bsu.quantity) + p.quantity + COALESCE(ss.storage_quantity, 0) AS total_quantity
FROM products p
JOIN batch_sums bsu ON bsu.product_id = p.id
LEFT JOIN storage_sums ss ON ss.product_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.quantity, ss.storage_quantity
ORDER BY p.name;
`;
