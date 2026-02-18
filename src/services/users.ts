import { query } from "db"
import type { InsertUser, DatabaseUser, User, DatabaseUserWithAuth } from "schemas/users"

export const createUser = async (data: InsertUser): Promise<DatabaseUser> => {
  const result = await query(`
    INSERT INTO users (
    guid,
    code,
    code_drfo,
    username,
    first_name,
    last_name,
    patronymic,
    date_of_birth,
    email,
    phone,
    gender,
    departments) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [ data.guid, 
      data.code, 
      data.taxCode, 
      data.username, 
      data.firstName, 
      data.lastName, 
      data.patronymic, 
      data.dateOfBirth, 
      data.email, 
      data.phone, 
      data.gender, 
      data.departments
    ])

  if (!result.rows.length) {
    throw new Error("User already exists");
  }

  return result.rows[0];
}

export const getUsers = async(): Promise<DatabaseUser[]> => { 
  const result = await query("SELECT * FROM users");
  return result.rows;
}

export const getUserById = async (id: number): Promise<DatabaseUser> => {
  const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id])
  return result.rows[0];
}

export const getUserByCode = async (code: string): Promise<DatabaseUser> => {
  const result = await query(`SELECT * FROM users WHERE code = $1 LIMIT 1`, [code])
  return result.rows[0];
}

export const getUserByUsername = async (username: string): Promise<DatabaseUser> => {
  const result = await query(`SELECT * FROM users WHERE username = $1 LIMIT 1`, [username])
  return result.rows[0];
}

export const updateUserById = async (id: number, data: InsertUser): Promise<DatabaseUser> => {
  const result = await query(`UPDATE users SET 
    guid = $2,
    code = $3,
    code_drfo = $4,
    username = $5,
    first_name = $6,
    last_name = $7,
    patronymic = $8,
    date_of_birth = $9,
    email = $10,
    phone = $11,
    gender = $12,
    departments = $13,
    role = $14
    WHERE id = $1 RETURNING *`, 
    [
      id, 
      data.guid, 
      data.code, 
      data.taxCode, 
      data.username, 
      data.firstName, 
      data.lastName,
      data.patronymic,
      data.dateOfBirth,
      data.email,
      data.phone,
      data.gender,
      data.departments,
      data.role,
    ]);
  return result.rows[0];
}

export const getUserWithAuthByCode = async (code: string): Promise<DatabaseUserWithAuth> => {
  const result = await query((`SELECT * FROM users u JOIN authentication a on a.user_id = u.id WHERE u.code = $1 LIMIT 1`), [code])
  return result.rows[0];
}

export const getUserWithAuthByUsername = async (username: string): Promise<DatabaseUserWithAuth> => {
  const result = await query(`SELECT u.*, a.hash, a.salt FROM users u JOIN authentication a on a.user_id = u.id WHERE u.username = $1 LIMIT 1`, [username])
  return result.rows[0];
}

// WIP
// export const getUser = async (identity: Partial<User>): Promise<DatabaseUser> => { 
//   const where  = buildWhereClause(identity)
//
//   const result = await query((`SELECT * FROM users ${where.clause} LIMIT 1`), where.values)
//   return result.rows[0];
// }
//
// export const updateUser = async (identity: Partial<User>, update: Partial<User>): Promise<User> => {
//   const set = buildSetClause(update)
//   const where  = buildWhereClause(identity, set.values.length + 1)
//
//   const result = await query((`
//     UPDATE users 
//     ${set.clause} 
//     ${where.clause} 
//     RETURNING *`), 
//     [...set.values, ...where.values])
//   return result.rows[0];
// }
//
// export const deleteUser = async (identity: Partial<User>): Promise<any> => { 
//   const where  = buildWhereClause(identity)
//
//   const result = await query((`DELETE FROM users ${where.clause} RETURNING *`), where.values)
//   return result.rows[0];
// }
