import { asyncHandler } from "utils/errorHandler";
import type express from "express";
import { paramsSchema } from "schemas/utils";
import type { Service } from "./service";
import type { ZodType } from "zod";

export abstract class Controller<T, TInsert, TService extends Service<T, TInsert, any, any>> {
  protected service: TService;
  protected insertSchema: ZodType<TInsert>;

  constructor(service: TService, insertSchema: ZodType<TInsert>) {
    this.service = service;
    this.insertSchema = insertSchema;
  }

  find = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.service.find(id);
    res.status(200).json(result);
  });

  findMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.service.findMany();
    res.status(200).json(result);
  });

  create = asyncHandler(async (req: express.Request, res: express.Response) => {
    const data = this.insertSchema.parse(req.body);
    const result = await this.service.create(data);
    res.status(200).json(result);
  });

  update = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const data = this.insertSchema.parse(req.body);
    const result = await this.service.update(id, data);
    res.status(200).json(result);
  });

  patch = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const data = this.insertSchema.parse(req.body);
    const result = await this.service.patch(id, data);
    res.status(200).json(result);
  });

  delete = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.service.delete(id);
    res.status(200).json(result);
  });

