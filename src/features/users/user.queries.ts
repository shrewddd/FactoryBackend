export const USER_WITH_ALL_QUERY = `
SELECT
  u.*,
  r.label                  AS role_label,
  r.is_active              AS role_is_active,
  r.can_override_workflow  AS role_can_override_workflow,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id',       d.id,
        'label',    d.label,
        'is_active', d.is_active
      )
    ) FILTER (WHERE d.id IS NOT NULL),
    '[]'
  ) AS departments
FROM users u
LEFT JOIN roles r             ON r.id = u.role_id
LEFT JOIN user_departments ud ON ud.user_id = u.id
LEFT JOIN departments d       ON d.id = ud.department_id`;
