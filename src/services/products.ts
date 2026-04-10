import { ProductRepository } from "repositories/products";
import type { ProductInsert } from "schemas/products";
import { HttpError } from "utils/errorHandler";

export class ProductService {

  private productRepository: ProductRepository;

  constructor(productRepository?: ProductRepository) {
    this.productRepository = productRepository ?? new ProductRepository();
  }

  async find(id: number) {
    const product = await this.productRepository.find(id);
    return product;
  }

  async findMany() {
    const products = await this.productRepository.findMany();
    return products;
  }

  async create(data: ProductInsert) {
    const product = await this.productRepository.create(data);
    return product;
  }

  async update(id: number, data: ProductInsert) {
    const product = await this.productRepository.update(id, data);
    if (!product) throw new HttpError(404, `Product with ID ${id} not found`)
    return product;
  }

  async findQuantities() {
    const products: any = await this.productRepository.findQuantities();
    return products;
  }
}
