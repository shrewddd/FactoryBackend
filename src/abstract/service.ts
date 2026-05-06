import type { Repository } from "./repository";

export abstract class Service<T, TInsert, TRepository extends Repository<T, any, any, TInsert>> {

  protected repository: TRepository;

  constructor(repository: TRepository) {
    this.repository = repository;
  }

  async find(id: number): Promise<T | null> {
    const result = await this.repository.find(id);
    return result;
  }

  async findMany(): Promise<T[]> {
    const result = await this.repository.findMany();
    return result;
  }

  async create(data: TInsert): Promise<T> {
    const result = await this.repository.create(data);
    return result;
  }

  async createMany(data: TInsert[]): Promise<T[]> {
    const result = await this.repository.createMany(data);
    return result;
  }

  async update(id: number, data: TInsert): Promise<T> {
    const result = await this.repository.update(id, data);
    return result;
  }

  async updateMany(ids: number[], data: TInsert): Promise<T[]> {
    const result = await this.repository.updateMany(ids, data);
    return result;
  }

  async patch(id: number, data: Partial<TInsert>): Promise<T> {
    const result = await this.repository.patch(id, data);
    return result;
  }

  async patchMany(ids: number[], data: Partial<TInsert>): Promise<T[]> {
    const result = await this.repository.patchMany(ids, data);
    return result;
  }

  async delete(id: number): Promise<T> {
    const result = await this.repository.delete(id);
    return result;
  }

  async deleteMany(ids: number[]): Promise<T[]> {
    const result = await this.repository.deleteMany(ids);
    return result;
  }
}
