import { AuthenticationRepository } from "repositories/auth";
import { UserRepository } from "repositories/users";
import type { AuthenticationInsert } from "schemas/authentication";
import { UserFromRow, type UserLogin, type UserRegister } from "schemas/user";
import { authentication, random } from "utils/authentication";
import { HttpError } from "utils/errorHandler";
import jwt from "jsonwebtoken";

export class AuthenticationService {

  private authRepository: AuthenticationRepository;
  private userRepository: UserRepository;

  constructor(authRepository?: AuthenticationRepository, userRepository?: UserRepository) {
    this.authRepository = authRepository ?? new AuthenticationRepository()
    this.userRepository = userRepository ?? new UserRepository();
  }

  async register(data: UserRegister) {
    const { user, password } = data
    if (!user.code && !user.username) throw new HttpError(401, "You must provide code or username");

    const { code, username } = user;

    const existingUser = code ? 
      await this.userRepository.find({ code }) : 
      username &&
      await this.userRepository.find({ username });

    if (existingUser) throw new HttpError(409, "User already exists");

    const addedUser = await this.userRepository.create(user)

    const salt = random()
    const hash = authentication(salt, password)

    const authObject: AuthenticationInsert = { userId: addedUser.id, salt, hash}

    await this.authRepository.create(authObject);

    return addedUser;
  }

  async login(data: UserLogin) {
    const { user, password } = data
    if (!user.code && !user.username) throw new HttpError(401, "You must provide code or username");

    const { code, username } = user;

    const existingUser = code ? 
      await this.userRepository.find({ code }) : 
      username &&
      await this.userRepository.find({ username });

    if (!existingUser) throw new HttpError(401, "User is not found")

    const auth = await this.authRepository.find(existingUser.id);
    const expectedHash = authentication(auth.salt, password);

    if(expectedHash !== auth.hash) throw new HttpError(401, "Invalid credentials");

    const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    return token;
  }

  async whoami(id: number) {
    const user = await this.userRepository.find({ id })
    if (!user) throw new HttpError(404, `User with ID ${id} not found`)
    return user;
  }
}
