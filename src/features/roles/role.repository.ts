import { Repository } from "abstract/repository";
import { RoleFromRow, type Role, type RoleInsert, type RoleLookup, type RoleRow } from "./role.schema";

export class RoleRepository extends Repository<Role, RoleRow, RoleLookup, RoleInsert> {
  constructor() {
    super("roles", RoleFromRow, { label: "label", canOverrideWorkflow: "can_override_workflow", isActive: "is_active" })
  }
}
