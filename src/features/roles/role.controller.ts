import { Controller } from "abstract/controller";
import { RoleInsertSchema, type Role, type RoleInsert } from "./role.schema";
import { RoleService } from "./role.service";

export class RoleController extends Controller<Role, RoleInsert, RoleService> {
  constructor(service: RoleService = new RoleService()) {
    super(service, RoleInsertSchema);
  }
}
