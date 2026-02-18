import express from "express";
import { InsertUserSchema, UserFromDatabase, UsersFromDatabase, type DatabaseUser, type User } from "schemas/users";
import { paramsSchema } from "schemas/utils";
import { getUserById, getUsers, updateUserById } from "services/users";
import { asyncHandler, HttpError } from "utils/errorHandler";


export const getUsersController = asyncHandler(async (req: express.Request, res: express.Response ) => {
  const databaseUsers: DatabaseUser[] = await getUsers();
  const users: User[] = UsersFromDatabase.parse(databaseUsers)
  res.status(200).json(users);
});

export const getUserController = asyncHandler(async (req: express.Request, res:express.Response) => {
  const { id } = paramsSchema.parse(req.params)
  const data = await getUserById(id)
  const user = UserFromDatabase.parse(data)
  res.status(200).json(user);
})

export const updateUserController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.params) 
  const data = InsertUserSchema.parse(req.body); 
  const databaseResult= await updateUserById(id, data)
  if (!databaseResult) throw new HttpError(404, `User with ID ${id} not found`);
  const user = UserFromDatabase.parse(databaseResult); 
  res.status(200).json(user);
});
