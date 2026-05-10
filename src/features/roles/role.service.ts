import { Service } from "abstract/service";
import { RoleRepository } from "./role.repository";
import type { Role, RoleInsert, RoleLookup } from "./role.schema";

export class RoleService extends Service<Role, RoleInsert, RoleLookup, RoleRepository> {
  constructor(repo: RoleRepository = new RoleRepository()){
    super(repo)
  }
}
