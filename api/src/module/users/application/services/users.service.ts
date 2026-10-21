import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../../domains/repositories/users.repository';
import { CreateUserDTO } from '../../presentation/http/schemas/create-user.schema';
import { hashPassword, matchPassword } from '../functions/hash_password';

// Mesmo padrão do AdminGuard: usuário do token inexistente ou soft-deletado -> 401.
const SESSION_ERROR_MESSAGE =
  'Houve um erro na sua autenticação. Tente logar novamente.';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    return user;
  }

  public async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) throw new UnauthorizedException(SESSION_ERROR_MESSAGE);

    return user;
  }

  public async updateName(userId: string, name: string) {
    const user = await this.usersRepository.updateName(userId, name);

    if (!user) throw new UnauthorizedException(SESSION_ERROR_MESSAGE);

    return user;
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findByIdWithPasswordHash(userId);

    if (!user) throw new UnauthorizedException(SESSION_ERROR_MESSAGE);

    if (user.isDemo) {
      throw new ForbiddenException(
        'A senha da conta de demonstração não pode ser alterada',
      );
    }

    const isCurrentPasswordValid = await matchPassword(
      user.password_hash,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Mesmo algoritmo e custo do cadastro (hashPassword).
    const newPasswordHash = await hashPassword(newPassword);
    const updated = await this.usersRepository.updatePasswordHash(
      userId,
      newPasswordHash,
    );

    if (!updated) throw new UnauthorizedException(SESSION_ERROR_MESSAGE);

    // TODO(produção): trocar a senha deve invalidar as demais sessões. Hoje o
    // projeto só emite access token JWT stateless (sem refresh token nem
    // token_version), então os tokens já emitidos valem até expirar
    // (JWT_ACCESS_EXPIRES_IN). Solução: coluna users.token_version incluída no
    // JWT e conferida no AuthGuard (incrementar aqui), ou lista de revogação.
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
