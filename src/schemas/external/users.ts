import { z } from "zod";
import type { InsertUser } from "schemas/users";
import { emptyToNull, dateOrNull } from "schemas/utils";

export const ExternalUserSchema = z.object({
  GUID: emptyToNull,
  Code: emptyToNull,
  Name: emptyToNull,
  BDate: dateOrNull,
  CodeDRFO: emptyToNull,
  LName: emptyToNull.nullish(),
  FName: emptyToNull.nullish(),
  SName: emptyToNull.nullish(),
});

export const UserFromExternalSchema = ExternalUserSchema.transform((u): InsertUser => ({
    guid: u.GUID,
    code: u.Code,
    taxCode: u.CodeDRFO,
    username: null,
    firstName: u.FName ?? "",
    lastName: u.LName ?? "",
    patronymic: u.SName ?? null,
    dateOfBirth: u.BDate,
    email: null,
    phone: null,
    gender: "Other",
    departments: [],
    role: "Worker",
  }),
);

export const UsersFromExternalSchema = UserFromExternalSchema.array();


