import { QRCodeService } from "services_new/qrcodes";
import type express from "express";
import { asyncHandler } from "utils/errorHandler";
import { paramsSchema } from "schemas/utils";
import { QRCodeInitialzieSchema, QRCodeInsertSchema, QRCodeLinkSchema } from "schemas/qrcode";
import { CLIENT_URL } from "config";

export class QRCodeController {

  private qrcodeService: QRCodeService;

  constructor (qrcodeService?: QRCodeService) {
    this.qrcodeService = qrcodeService ?? new QRCodeService()
  }

  findMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const result = await this.qrcodeService.findMany();
    res.status(200).json(result);
  });

  find = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.qrcodeService.find(id);
    res.status(200).json(result);
  });

  create = asyncHandler(async (req: express.Request, res: express.Response) => {
    const data = QRCodeInsertSchema.parse(req.body)
    const result = await this.qrcodeService.create(data);
    res.status(201).json(result);
  });

  createMany = asyncHandler(async (req: express.Request, res: express.Response) => {
    const data = QRCodeInitialzieSchema.parse(req.body)
    const result = await this.qrcodeService.createMany(data);
    res.status(201).json(result);
  });

  link = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const { resource }= QRCodeLinkSchema.parse(req.body)
    const result = await this.qrcodeService.link(id, resource);
    res.status(200).json(result);
  });

  scan = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = paramsSchema.parse(req.params);
    const result = await this.qrcodeService.find(id);
    if (result.resource) res.redirect(result.resource);
    res.redirect(`${CLIENT_URL}/qrcodes/${result.id}`)
  });
}
