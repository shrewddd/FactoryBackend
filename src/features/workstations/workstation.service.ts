import { Service } from "abstract/service";
import { WorkstationRepository } from "./workstation.repository";
import type { Workstation, WorkstationInsert, WorkstationLookup } from "./workstation.schema";

export class WorkstationService extends Service<Workstation, WorkstationInsert, WorkstationLookup, WorkstationRepository> {
  constructor(repo: WorkstationRepository = new WorkstationRepository()){
    super(repo)
  }
}
