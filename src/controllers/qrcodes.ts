import express from "express";
import { InitializeQRCodeSchema, InsertQRCodeSchema, QRCodeFromDatabase, QRCodesFromDatabase } from "schemas/qrcode";
import QRCode from 'qrcode';
import { BASE_URL, CLIENT_URL } from "config";
import { asyncHandler, HttpError } from "utils/errorHandler";
import { paramsSchema } from "schemas/utils";
import { qrcodeService as service } from "services/qrCodes";

export const getQRCodesController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const databaseResult = await service.getAll();
  const qrCodes = QRCodesFromDatabase.parse(databaseResult);
  const qrCodesWithImages = await Promise.all(
    qrCodes.map(async (qr) => {
      const scanUrl = `${BASE_URL}/qrcodes/${qr.id}/scan`;
      const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {width: 300, margin: 2, errorCorrectionLevel: 'M'});
      return {
        ...qr,
        qrcodeImage: qrCodeDataUrl,
        scanUrl: scanUrl
      };
    })
  );
  res.status(200).json(qrCodesWithImages);
})

export const getQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.params);
  const result = await service.get(id);
  if (!result) throw new HttpError(404, `QR-Code with ID ${id} not found`);
  const qrCode = QRCodeFromDatabase.parse(result);
  res.status(200).json(qrCode);
})

export const createQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const qrcode = InsertQRCodeSchema.parse(req.body); 
  const data = await service.create(qrcode);
  const result = QRCodesFromDatabase.parse(data);
  res.status(201).json(result);
})

export const createQRCodesController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { qrcode, amount } = InitializeQRCodeSchema.parse(req.body); 
  const data = await service.createMultiple(qrcode, amount);
  const result = QRCodesFromDatabase.parse(data);
  res.status(201).json(result);
})

export const updateQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.params)
  const data = InsertQRCodeSchema.parse(req.body); 
  const result = await service.update(id, data)
  const qrCode = QRCodeFromDatabase.parse(result); 
  res.status(200).json(qrCode);
})

export const deleteQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.body);
  const result = await service.delete(id);
  if (!result) throw new HttpError(404, `QR-Code with ID ${id} not found`);
  const qrCode = QRCodeFromDatabase.parse(result);
  res.status(200).json(qrCode);
})

export const activateQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.params);
  const resource = req.body.resource; 
  if(resource === undefined) throw new HttpError(400, "Resource was not provided");
  const data = await service.activate(id, resource);
  if(!data) throw new HttpError(404, `QR-Code with ID ${id} not found`);
  const result = QRCodeFromDatabase.parse(data);
  res.status(200).json(result);
})

export const scanQRCodeController = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = paramsSchema.parse(req.params);
  const result = await service.get(id);
  const qrCode = QRCodeFromDatabase.parse(result);
  if(!qrCode) throw new HttpError(404, `QR-Code with ID ${id} not found`);
  if (qrCode.resource) res.redirect(qrCode.resource);
  res.redirect(`${CLIENT_URL}/qrcodes/${qrCode.id}`)
})
