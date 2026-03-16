import { z } from "zod";
import { DbId } from "./utils";
import { RoleSchema } from "./roles";
import { DepartmentSchema } from "./departments";

export const genderEnum = z.enum(["Male", "Female", "Other"]);

const shared = {
  id: DbId,
  code: z.string().nullish(),
  username: z.string().nullish(),
  patronymic: z.string().nullish(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  gender: genderEnum.nullish().default("Other"),
  departments: DepartmentSchema.array().nullish().default([]),
};

const mapped = {
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string().nullish(),
  role: z.object({
    id: RoleSchema.shape.id,
    label: RoleSchema.shape.label.nullish(),
    is_active: RoleSchema.shape.isActive.nullish(),
    can_override_workflow: RoleSchema.shape.canOverrideWorkflow.nullish(),
  }).nullish(),
  dateOfBirth: z.coerce.date().nullish(),
  isActive: z.boolean().default(true),
};

export const UserSchema = z.object({ ...shared, ...mapped });

export const UserRowSchema = z.object({
  ...shared,
  first_name: mapped.firstName,
  last_name: mapped.lastName,
  full_name: mapped.fullName,
  date_of_birth: mapped.dateOfBirth,
  is_active: mapped.isActive,
  role_id: RoleSchema.shape.id.nullish(),
  role_label: RoleSchema.shape.label.nullish(),
  role_is_active: RoleSchema.shape.isActive.nullish(),
  role_can_override_workflow: RoleSchema.shape.canOverrideWorkflow.nullish(),
});

export const UserLookupSchema = z.union([
  z.object({ id: z.number() }),
  z.object({ code: z.string() }),
  z.object({ username: z.string() }),
]);

export const UserFromRow = UserRowSchema.transform((row) => {
  const { 
    first_name, 
    last_name, 
    full_name,
    date_of_birth,
    role_id,
    role_label,
    role_is_active,
    role_can_override_workflow,
    ...rest
  } = row;
  return {
    ...rest,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    role: row.role_id ? {
      id: row.role_id,
      label: row.role_label ?? undefined,
      isActive: row.role_is_active ?? undefined,
      canOverrideWorkflow: row.role_can_override_workflow ?? undefined
    } : null,
    isActive: row.is_active,
  };
});

export const UserInsertSchema = UserSchema
  .omit({ id: true, fullName: true, role: true, departments: true })
  .partial({ isActive: true, patronymic: true })
  .extend({
    gender: genderEnum.default("Other"),
    roleId: RoleSchema.shape.id.nullish(),
    departmentIds: DbId.array().nullish().default([])
  });


export const UserRegisterSchema = UserInsertSchema.extend({
  password: z.string().min(8),
}).transform(({ password, ...user }) => ({ user, password }));


export const UserLoginSchema = z
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

export type User = z.infer<typeof UserSchema>
export type UserRow = z.infer<typeof UserRowSchema>
export type UserInsert = z.infer<typeof UserInsertSchema>
export type UserLookup = z.infer<typeof UserLookupSchema>
export type UserRegister = z.infer<typeof UserRegisterSchema>
export type UserLogin = z.infer<typeof UserLoginSchema>
