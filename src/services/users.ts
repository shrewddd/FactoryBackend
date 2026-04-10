import { UserRepository } from "repositories/users";
import type { UserInsert } from "schemas/user";
import { HttpError } from "utils/errorHandler";

export class UserService {

  private userRepository: UserRepository; 

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository ?? new UserRepository()
  }

  async find(id: number) {
    const user = await this.userRepository.find({ id });
    return user;
  }

  async findMany() {
    const users = await this.userRepository.findMany();
    return users;
  }

  async update(id: number, data: UserInsert) {
    const user = await this.userRepository.update(id, data);
    if (!user) throw new HttpError(404, `User with ID ${id} not found`);
    return user;
  }
}
