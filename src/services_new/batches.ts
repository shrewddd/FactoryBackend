import { BatchRepository } from "repositories/batches";
import type { BatchInsert } from "schemas/batches";

export class BatchService {

  private batchRepository: BatchRepository;

  constructor(batchRepository?: BatchRepository) {
    this.batchRepository = batchRepository ?? new BatchRepository();
  }

  async find(id: number) {
    const batch = await this.batchRepository.find(id);
    return batch;
  }

  async findMany() {
    const batch = await this.batchRepository.findMany();
    return batch;
  }

  async create(data: BatchInsert) {
    const batch = await this.batchRepository.create(data)
    return batch
  }

  async update(id: number, data: BatchInsert) {
    const batch = await this.batchRepository.update(id, data);
    return batch;
  }

  async delete(id: number) {
    const batch = await this.batchRepository.delete(id);
    return batch;
  }

  async advance(
    id: number, 
    actorId: number,
    defects: { defect_type_id: number; quantity: number}[],
    sizeOverride?: number,
  ) {
    const batch = await this.batchRepository.advance(id, actorId, defects, sizeOverride);
    return batch;
  }
}

