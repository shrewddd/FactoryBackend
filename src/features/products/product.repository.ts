import { Repository } from "abstract/repository";
import {
  ProductFromRow,
  type Product,
  type ProductInsert,
  type ProductLookup,
  type ProductRow,
} from "./product.schema";
import { query } from "db";
import { QuantitiesByStatusFromRow, type QuantitiesByStatus } from "schemas/productQuantities";
import { DefectsByProductFromRow, type DefectsByProduct, type DefectsByProductRow } from "schemas/defectQuantities";
import { ProductQuantitiesByMilestoneFromRow, type ProductQuantitiesByMilestone, type ProductQuantitiesByMilestoneRow } from "schemas/productInventory";
import { FIND_DEFECTS_QUERY, FIND_INVENTORY_QUERY, FIND_QUANTITIES_QUERY } from "./product.queries";

export class ProductRepository extends Repository<Product, ProductRow, ProductLookup, ProductInsert> {
  constructor() {
    super("products", ProductFromRow, {
      name: "name",
      code: "code",
      measureUnit: {
        column: "measure_unit_id",
        extract: (d) => d.measureUnit?.id || 1,
      },
      isActive: "is_active",
      quantity: "quantity",
      boxSize: "box_size",
    });
  }

  async findQuantities(): Promise<QuantitiesByStatus[]> {
    const result = await query(FIND_QUANTITIES_QUERY);
    return QuantitiesByStatusFromRow.array().parse(result.rows);
  }

  async findDefects(): Promise<DefectsByProduct[]> {
    const result = await query<DefectsByProductRow>(FIND_DEFECTS_QUERY);
    return DefectsByProductFromRow.array().parse(result.rows);
  }

  async findInventory(): Promise<ProductQuantitiesByMilestone[]> {
    const result = await query<ProductQuantitiesByMilestoneRow>(FIND_INVENTORY_QUERY);
    return ProductQuantitiesByMilestoneFromRow.array().parse(result.rows);
  }
}
