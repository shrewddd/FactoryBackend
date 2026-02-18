import data from "data/users.json";
import type { DatabaseUser, InsertUser } from "schemas/users";
import { UsersFromExternalSchema } from "schemas/external/users";
import { query } from "db";
import { random, authentication } from "utils/authentication";
import dotenv from "dotenv"


export const RegisterExternalUsers = async (): Promise<DatabaseUser[]> => {

  dotenv.config()
  const password = process.env.TEMP_PASSWORD;

  if (!password)
    throw Error("Temp password is not set")

  const users: InsertUser[] = UsersFromExternalSchema.parse(data.Users);

  const seen = new Set<string>();
  const uniqueUsers = users.filter((u) => {
    if (!u.code) return false;
    if (seen.has(u.code)) return false;
    seen.add(u.code);
    return true;
  });

  if (!uniqueUsers.length) return [];

  const columns = [
    "guid",
    "code",
    "code_drfo",
    "username",
    "first_name",
    "last_name",
    "patronymic",
    "date_of_birth",
    "email",
    "phone",
    "gender",
    "departments",
  ];

  const values: any[] = [];

  const placeholders = uniqueUsers.map((u, i) => {
    const offset = i * columns.length;

    values.push(
      u.guid,
      u.code,
      u.taxCode,
      u.username,
      u.firstName,
      u.lastName,
      u.patronymic,
      u.dateOfBirth,
      u.email,
      u.phone,
      u.gender,
      u.departments
    );

    return `(${columns.map((_, j) => `$${offset + j + 1}`).join(",")})`;
  });

  const sql = `
    INSERT INTO users (${columns.join(",")})
    VALUES ${placeholders.join(",")}
    RETURNING *
  `;

  const result = await query(sql, values);
  const insertedUsers = result.rows as DatabaseUser[];

  const authValues: any[] = [];
  const authPlaceholders = insertedUsers.map((user, i) => {
    const salt = random();
    const hash = authentication(salt, password);

    const offset = i * 3;

    authValues.push(user.id, hash, salt);

    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  if (authPlaceholders.length) {
    const authSql = `
      INSERT INTO authentication (user_id, hash, salt)
      VALUES ${authPlaceholders.join(",")}
    `;

    await query(authSql, authValues);
  }

  return insertedUsers;
};
