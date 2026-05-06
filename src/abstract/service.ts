import type { BaseRepository, Lookup } from "./types";

export abstract class Service<
  T,
  TInsert,
  TLookup extends Lookup,
  TRepository extends BaseRepository<T, TInsert, TLookup>,
> {
  protected repository: TRepository;

  constructor(repository: TRepository) {
    this.repository = repository;
  }

  async find(id: number): Promise<T | null> {
    const result = await this.repository.find({ id } as any);
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
