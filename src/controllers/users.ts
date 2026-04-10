import type express from "express";
import { UserInsertSchema, UserLoginSchema, UserRegisterSchema } from "schemas/user";
import { paramsSchema } from "schemas/utils";
import { UserService } from "services/users";
import { asyncHandler } from "utils/errorHandler";

export class UserController {

  private userService: UserService;

  constructor(userService?: UserService) {
    this.userService = userService ?? new UserService();
  }

  find = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.userService.find(id);
    res.status(200).json(result);
  });

  findMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.userService.findMany();
    res.status(200).json(result);
  });

  update = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const data = UserInsertSchema.parse(req.body);
    const result = await this.userService.update(id, data);
    res.status(200).json(result);
  });
}
