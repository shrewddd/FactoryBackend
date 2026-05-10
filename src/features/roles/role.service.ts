import { Service } from "abstract/service";
import { RoleRepository } from "./role.repository";
import type { Role, RoleRow } from "schemas/roles";
import type { RoleLookup } from "./role.schema";

export class RoleService extends Service<Role, RoleRow, RoleLookup, RoleRepository> {
  constructor(repo: RoleRepository = new RoleRepository()){
    super(repo)
  }
}
