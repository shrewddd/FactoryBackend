import { WorkstationRepository } from "repositories/workstations";

export class WorkstationService {

  private workstationRepository: WorkstationRepository;

  constructor (workstationRepository?: WorkstationRepository) {
    this.workstationRepository = workstationRepository ?? new WorkstationRepository()
  }

  async find(id: number) {
    const workstation = this.workstationRepository.find(id);
    return workstation;
  }

  async findMany() {
    const workstations = this.workstationRepository.findMany();
    return workstations;
  }
}

