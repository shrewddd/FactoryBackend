import { Controller } from "abstract/controller";
import { WorkstationService } from "./workstation.service";
import { WorkstationInsertSchema } from "./workstation.schema";
import type { Workstation, WorkstationInsert } from "./workstation.schema";

export class WorkstationController extends Controller<Workstation, WorkstationInsert, WorkstationService> {
  constructor(service: WorkstationService = new WorkstationService()) {
    super(service, WorkstationInsertSchema);
  }
}
