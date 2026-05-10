import { Repository } from "abstract/repository";
import { WorkstationFromRow, type Workstation, type WorkstationInsert, type WorkstationLookup, type WorkstationRow } from "./workstation.schema";

export class WorkstationRepository extends Repository<Workstation, WorkstationRow, WorkstationLookup, WorkstationInsert> {
  constructor() {
    super("workstations", WorkstationFromRow, { name: "name", qrcode: { column: 'qr_code_id', extract: (d) => d.qrcode.id }, isActive: "is_active" })
  }
}
