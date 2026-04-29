import { ZodError } from "zod"
import express from "express"
import logger from "logger"

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type AsyncController = (req: express.Request, res: express.Response) => Promise<void>

export const asyncHandler = (fn: AsyncController) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await fn(req, res);
  } catch (error: any) {

    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof ZodError) {
      logger.error(error);
      return res.status(400).json({ error: "Invalid data", details: error.message });
    }

    if (error.status && error.message) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.error(error);

    return res.status(500).json({
      error: error instanceof Error
        ? error.message
        : "Internal server error",
    });

    // return res.status(500).json({ error: "Internal server error" });
  }
};
