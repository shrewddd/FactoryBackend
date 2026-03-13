import type { ProductRepository } from "repositories/products";
import type { ProductInsert } from "schemas/products";
import { HttpError } from "utils/errorHandler";

export class ProductService {

  constructor(private productRepository: ProductRepository) {}

  async find(id: number) {
    const product = await this.productRepository.find(id);
    return product;
  }

  async findMany() {
    const products = await this.productRepository.findMany();
    return products;
  }

  async update(id: number, data: ProductInsert) {
    const product = await this.productRepository.update(id, data);
    if (!product) throw new HttpError(404, `Product with ID ${id} not found`)
    return product;
  }
}
