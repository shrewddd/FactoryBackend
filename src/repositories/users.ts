import { query, transaction } from "db";
import { UserFromRow, type User, type UserInsert, type UserLookup, type UserRow } from "schemas/user";
import { buildValuesPlaceholders } from "utils/queries/bulkInsert";

export class UserRepository {
  private readonly WITH_ALL_QUERY = `
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
  LEFT JOIN departments d       ON d.id = ud.department_id
`;

  async findMany(): Promise<User[]> {
    const result = await query<UserRow>(
      `${this.WITH_ALL_QUERY}
    GROUP BY u.id, r.id`,
    );
    return UserFromRow.array().parse(result.rows);
  }

  async find(by: UserLookup): Promise<User | null> {
    const [field, value] = Object.entries(by)[0] ?? [];
    if (!field || value === undefined) throw new Error("Invalid lookup");

    const result = await query<UserRow>(
      `${this.WITH_ALL_QUERY}
    WHERE u.${field} = $1
    GROUP BY u.id, r.id
    LIMIT 1`,
      [value],
    );

    if (!result.rows[0]) return null;
    return UserFromRow.parse(result.rows[0]);
  }

  // async findMany(): Promise<User[]> { # WIP, will add include { } thing later
  //   const result = await query<UserRow>(`SELECT * FROM users`);
  //   const rows = result.rows;
  //   return UserFromRow.array().parse(rows);
  // }
  //
  // async find(by: UserLookup): Promise<User | null> {
  //   const [field, value] = Object.entries(by)[0] ?? [];
  //   if (!field || value === undefined) throw new Error("Invalid lookup");
  //   const result = await query<UserRow>(`SELECT * FROM users WHERE ${field} = $1 LIMIT 1`, [value]);
  //   const rows = result.rows;
  //   if (!rows[0]) return null;
  //   return UserFromRow.parse(rows[0]);
  // }
  //
  async create(data: UserInsert): Promise<User> {
    const result = await query<UserRow>(
      `INSERT INTO users (
        code,
        username,
        first_name,
        last_name,
        patronymic,
        date_of_birth,
        email,
        phone,
        gender,
        role_id,
        is_active
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
      [
        data.code,
        data.username,
        data.firstName,
        data.lastName,
        data.patronymic,
        data.dateOfBirth,
        data.email,
        data.phone,
        data.gender,
        data.roleId,
        data.isActive,
      ],
    );
    const rows = result.rows;
    return UserFromRow.parse(rows[0]);
  }

  async createMany(data: UserInsert[]): Promise<User[]> {
    const { placeholders, values } = buildValuesPlaceholders<UserInsert>(data, (user) => [
      user.code,
      user.username,
      user.firstName,
      user.lastName,
      user.patronymic,
      user.dateOfBirth,
      user.email,
      user.phone,
      user.gender,
      user.roleId,
      user.isActive,
    ]);
    const result = await query<UserRow>(
      `INSERT INTO users (code, username, first_name, last_name, patronymic, date_of_birth, email, phone, gender, role_id, is_active) VALUES ${placeholders}`,
      values,
    );
    const rows = result.rows;
    return UserFromRow.array().parse(rows);
  }

  async update(id: number, data: UserInsert): Promise<User> {
    const result = await query<UserRow>(
      `UPDATE users SET
      code = $2,
      username = $3,
      first_name = $4,
      last_name = $5,
      patronymic = $6,
      date_of_birth = $7,
      email = $8,
      phone = $9,
      gender = $10,
      role_id = $11,
      is_active = $12
      WHERE id = $1 RETURNING *
    `,
      [
        id,
        data.code,
        data.username,
        data.firstName,
        data.lastName,
        data.patronymic,
        data.dateOfBirth,
        data.email,
        data.phone,
        data.gender,
        data.roleId,
        data.isActive,
      ],
    );
    if (data.departmentIds) this.updateDepartments(id, data.departmentIds);
    const rows = result.rows;
    return UserFromRow.parse(rows[0]);
  }

  private async updateDepartments(userId: number, departmentIds: number[]): Promise<void> {
    await transaction(async (client) => {
      await client.query(`DELETE FROM user_departments WHERE user_id = $1`, [userId]);

      if (departmentIds.length > 0) {
        const values = departmentIds.map((_, i) => `($1, $${i + 2})`).join(", ");
        await client.query(`INSERT INTO user_departments (user_id, department_id) VALUES ${values}`, [
          userId,
          ...departmentIds,
        ]);
      }
    });
  }

  async delete(id: number): Promise<User> {
    const result = await query<UserRow>(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);
    const rows = result.rows;
    return UserFromRow.parse(rows[0]);
  }
}
