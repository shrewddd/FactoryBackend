import type express from "express";
import { UserLoginSchema, UserRegisterSchema } from "schemas/user";
import { AuthenticationService } from "services_new/auth";
import { asyncHandler, HttpError } from "utils/errorHandler";

export class AuthenticationController {

  private authService: AuthenticationService;

  constructor(authService?: AuthenticationService) {
    this.authService = authService ?? new AuthenticationService()
  }

  register = asyncHandler(async (req: express.Request, res: express.Response) => {
    const data = UserRegisterSchema.parse(req.body);
    const result = await this.authService.register(data);
    res.status(200).json(result).end();
  });

  login = asyncHandler(async (req: express.Request, res: express.Response) => {
    const data = UserLoginSchema.parse(req.body);
    const token = await this.authService.login(data);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    res.status(200).json("Success!").end();
  });

  logout = asyncHandler(async (req: express.Request, res: express.Response) => {
    res.clearCookie("token", { httpOnly: true });
    res.status(200).json({ message: "Logged out successfully" }).end();
  });

  whoami = asyncHandler(async (req: express.Request, res: express.Response) => {
    if (!req.userId) throw new HttpError(401, `Invalid data, you must provide userId`);
    const result = await this.authService.whoami(req.userId);
    res.status(200).json(result);
  });
}
