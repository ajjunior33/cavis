import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../../domains/repositories/users.repository';
import { CreateUserDTO } from '../../presentation/http/schemas/create-user.schema';
import { hashPassword, matchPassword } from '../functions/hash_password';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    return user;
  }

  public async create(data: CreateUserDTO) {
    const user = await this.usersRepository.findByEmail(data.email);

    if (user) {
      throw new BadRequestException('Usuário já existe.');
    }

    const passwordHash = await hashPassword(data.password);
    const payload = {
      name: data.name,
      password_hash: passwordHash,
      email: data.email,
    };

    console.log(payload);

    const create = await this.usersRepository.create(payload);
    return create;
  }

  public async validatePassword(email: string, password: string) {
    const user = await this.usersRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const validate = await matchPassword(user.password_hash, password);

    if (!validate)
      throw new UnauthorizedException('Usuário ou senha inválidos.');

    return true;
  }

  public async findEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    return user;
  }
}
