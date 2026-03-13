import type { QRCodeRepository } from "repositories/qrCodes";
import type { QRCodeInitialize, QRCodeInsert, QRCodeLink } from "schemas/qrcode";
import { HttpError } from "utils/errorHandler";

export class QRCodeService {
  constructor(private qrcodeRepository: QRCodeRepository) {}

  async findMany() {
    const qrcodes = await this.qrcodeRepository.findMany();
    return qrcodes;
  }

  async find(id: number) {
    const qrcode = await this.qrcodeRepository.find(id);
    return qrcode;
  }

  async create(data: QRCodeInsert) {
    const qrcode = await this.qrcodeRepository.create(data);
    return qrcode;
  }

  async createMany(data: QRCodeInitialize) {
    const items = Array.from({ length: data.amount }, () => ({...data.qrcode}))
    const qrcodes = await this.qrcodeRepository.createMany(items);
    return qrcodes;
  }

  async link(data: QRCodeLink) {
    const qrcode = await this.qrcodeRepository.link(data.id, data.resource)
    if(!qrcode) throw new HttpError(404, `QR-Code with ID ${data.id} not found`);
    return qrcode
  }
}
