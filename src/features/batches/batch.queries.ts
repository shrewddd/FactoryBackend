export const FIND_ALL_BATCHES_QUERY = `
SELECT
  b.id,
  b.name,
  b.size,
  b.is_active,

  b.product_id,
  p.name  AS product_name,

  b.workstation_id,
  w.name  AS workstation_name,

  b.status_id,
  bs.label                     AS status_label,
  bs.sort_order                 AS status_sort_order,
  bs.is_terminal                 AS status_is_terminal,
  bs.allows_defect_reporting      AS status_allows_defect_reporting,
  bs.is_active                     AS status_is_active,
  bs.is_in_progress                 AS status_is_in_progress,
  bs.is_finished                     AS status_is_finished,
  bs.requires_size_input               AS status_requires_size_input,
  bs.is_packaging                       AS status_is_packaging,
  bs.subtract_defects                    AS status_subtract_defects,
  bs.is_milestone                         AS status_is_milestone,
  bs.department_id                         AS status_department_id,
  sd.label                                   AS status_department_label,

  COALESCE(t.transitions, '[]'::json) AS transitions

FROM batches b
LEFT JOIN products       p  ON p.id  = b.product_id
LEFT JOIN workstations    w  ON w.id  = b.workstation_id
LEFT JOIN batch_statuses   bs ON bs.id = b.status_id
LEFT JOIN departments       sd ON sd.id = bs.department_id
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object(
      'id',           bt.id,
      'occurred_at',  bt.occurred_at,
      'batch_size',   bt.batch_size,

      'device_id',    bt.device_id,
      'device_name',  d.name,

      'actor_id',     bt.actor_id,
      'actor_name',   a.full_name,

      'from_status_id',                    fs.id,
      'from_status_label',                 fs.label,
      'from_status_sort_order',            fs.sort_order,
      'from_status_is_terminal',            fs.is_terminal,
      'from_status_allows_defect_reporting', fs.allows_defect_reporting,
      'from_status_is_active',                fs.is_active,
      'from_status_is_in_progress',            fs.is_in_progress,
      'from_status_is_finished',                fs.is_finished,
      'from_status_requires_size_input',         fs.requires_size_input,
      'from_status_is_packaging',                 fs.is_packaging,
      'from_status_subtract_defects',              fs.subtract_defects,
      'from_status_is_milestone',                   fs.is_milestone,
      'from_status_department_id',                   fs.department_id,
      'from_status_department_label',                 fsd.label,

      'to_status_id',                    ts.id,
      'to_status_label',                 ts.label,
      'to_status_sort_order',            ts.sort_order,
      'to_status_is_terminal',            ts.is_terminal,
      'to_status_allows_defect_reporting', ts.allows_defect_reporting,
      'to_status_is_active',                ts.is_active,
      'to_status_is_in_progress',            ts.is_in_progress,
      'to_status_is_finished',                ts.is_finished,
      'to_status_requires_size_input',         ts.requires_size_input,
      'to_status_is_packaging',                 ts.is_packaging,
      'to_status_subtract_defects',              ts.subtract_defects,
      'to_status_is_milestone',                   ts.is_milestone,
      'to_status_department_id',                   ts.department_id,
      'to_status_department_label',                 tsd.label,

      'coworkers', COALESCE(cw.coworkers, '[]'::json),
      'defects',   COALESCE(dft.defects, '[]'::json)
    )
    ORDER BY bt.occurred_at DESC
  ) AS transitions
  FROM batch_transitions bt
  LEFT JOIN devices        d   ON d.id  = bt.device_id
  LEFT JOIN users           a   ON a.id  = bt.actor_id
  LEFT JOIN batch_statuses   fs  ON fs.id = bt.from_status_id
  LEFT JOIN departments       fsd ON fsd.id = fs.department_id
  LEFT JOIN batch_statuses    ts  ON ts.id = bt.to_status_id
  LEFT JOIN departments        tsd ON tsd.id = ts.department_id
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', u.id, 'full_name', u.full_name)) AS coworkers
    FROM batch_transition_coworkers btc
    JOIN users u ON u.id = btc.worker_id
    WHERE btc.transition_id = bt.id
  ) cw ON true
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'id',                    df.id,
        'quantity',               df.quantity,
        'transition_id',           df.transition_id,
        'defect_type_id',          df.defect_type_id,
        'defect_type_label',        dt.label,
        'defect_type_category',      dt.category,
        'defect_type_sort_order',     dt.sort_order,
        'defect_type_is_active',       dt.is_active
      )
    ) AS defects
    FROM defects df
    JOIN defect_types dt ON dt.id = df.defect_type_id
    WHERE df.transition_id = bt.id
  ) dft ON true
  WHERE bt.batch_id = b.id
) t ON true
ORDER BY b.id DESC;
`;

export const FIND_ACTIVE_BY_WORKER_QUERY = `
SELECT b.*, bs.is_packaging AS status_is_packaging
FROM batches b
JOIN batch_statuses bs ON bs.id = b.status_id
JOIN LATERAL (
  SELECT bt.actor_id
  FROM batch_transitions bt
  WHERE bt.batch_id = b.id
  ORDER BY bt.occurred_at DESC
  LIMIT 1
) latest ON true
WHERE bs.is_in_progress = true
  AND latest.actor_id = $1;
`

export const BATCH_BASE_SELECT = `
  SELECT
    b.*,
    p.name  AS product_name,
    w.name  AS workstation_name,
    s.label                    AS status_label,
    s.sort_order                AS status_sort_order,
    s.is_terminal                AS status_is_terminal,
    s.allows_defect_reporting     AS status_allows_defect_reporting,
    s.is_active                  AS status_is_active,
    s.is_in_progress              AS status_is_in_progress,
    s.is_finished                 AS status_is_finished,
    s.requires_size_input          AS status_requires_size_input,
    s.is_packaging                AS status_is_packaging,
    s.subtract_defects             AS status_subtract_defects,
    s.is_milestone                AS status_is_milestone,
    s.department_id               AS status_department_id,
    d.label                      AS status_department_label
  FROM batches b
  LEFT JOIN products p        ON p.id = b.product_id
  LEFT JOIN workstations w    ON w.id = b.workstation_id
  LEFT JOIN batch_statuses s  ON s.id = b.status_id
  LEFT JOIN departments d     ON d.id = s.department_id
`;
