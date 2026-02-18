import { z } from "zod";
import { DbId } from "./utils";

const genderEnum = z.enum(["Male", "Female", "Other"]);
const roleEnum = z.enum([
  "Superuser",
  "Master",
  "Manager",
  "Worker",
  "Observer",
]);

const shared = {
  id: DbId,
  guid: z.string().nullish(),
  code: z.string().nullish(),
  username: z.string().nullish(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  gender: genderEnum.nullish().default("Other"),
  departments: z.string().array().nullish().default([]),
  role: roleEnum.nullish(),
}

const mapped = {
  taxCode: z.string().nullish(),
  firstName: z.string(),
  lastName: z.string(),
  patronymic: z.string().nullish(),
  fullName: z.string(),
  dateOfBirth: z.coerce.date().nullish(),
}

export const UserSchema = z.object({...shared, ...mapped});

export const DatabaseUserSchema = z.object({
  ...shared,
  code_drfo: mapped.taxCode,
  first_name: mapped.firstName,
  last_name: mapped.lastName,
  full_name: mapped.fullName,
  date_of_birth: mapped.dateOfBirth,
})

export const DatabaseUserWithAuth = DatabaseUserSchema.extend({
  hash: z.string(),
  salt: z.string()
})

export const UserFromDatabase = DatabaseUserSchema.transform((db) => {
  const { code_drfo, first_name, last_name, full_name, date_of_birth, ...rest} = db;
  return {
    ...rest,
    taxCode: code_drfo,
    firstName: first_name,
    lastName: last_name,
    fullName: full_name,
    dateOfBirth: date_of_birth,
  }
});

export const DatabaseFromUserSchema = UserSchema.transform((user) => {
  const { taxCode, firstName, lastName, fullName, dateOfBirth, ...rest} = user;
  return {
    ...rest,
    code_drfo: user.taxCode,
    first_name: user.firstName,
    last_name: user.lastName,
    patronymic: user.patronymic,
    full_name: user.fullName,
    date_of_birth: user.dateOfBirth,
  }
});

export const UserWithAuthFromDatabase = DatabaseUserWithAuth.transform((db) => ({
  ...UserFromDatabase.parse(db),
  auth: {
    hash: db.hash,
    salt: db.salt
  }
}))

export const InsertUserSchema = UserSchema.omit({ id: true, fullName: true });

export type User = z.infer<typeof UserSchema>;
export type UserWithAuth = z.infer<typeof UserWithAuthFromDatabase>
export type DatabaseUser = z.infer<typeof DatabaseUserSchema>;
export type DatabaseUserWithAuth = z.infer<typeof DatabaseUserWithAuth>

export const UsersFromDatabase = UserFromDatabase.array();
export const DatabaseFromUsers = DatabaseFromUserSchema.array();

export type InsertUser = z.infer<typeof InsertUserSchema>;

export const RegisterSchema = InsertUserSchema.extend({
  password: z.string().min(8),
}).transform(({ password, ...user }) => ({ user, password }));

export const LoginSchema = z
  .union([
    z.object({
      code: z.string(),
      password: z.string().min(8),
    }),
    z.object({
      username: z.string(),
      password: z.string().min(8),
    }),
  ])
  .transform((data) => ({
    user: {
      code: "code" in data ? data.code : undefined,
      username: "username" in data ? data.username : undefined,
    },
    password: data.password,
  }));
