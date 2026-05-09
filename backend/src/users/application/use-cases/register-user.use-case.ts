import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { PinoLogger } from 'nestjs-pino';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { EmailAlreadyTakenError, type IUserRepository, User } from '@/users/domain';
import type { AuthTokenDTO } from '../dtos/user.dto';
import { generateRefreshToken } from '../helpers/refresh-token.helper';
import type { IUserRegistrar } from '../ports/user-registrar.port';
import { type RegisterUserInput, RegisterUserInputSchema } from '../schemas/user.schemas';

interface Deps {
  userRepository: IUserRepository;
  userRegistrar: IUserRegistrar;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
  jwtService: JwtService;
  logger?: PinoLogger;
}

export class RegisterUserUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterUserInput): Promise<AuthTokenDTO> {
    const parsed = RegisterUserInputSchema.parse(input);

    const existing = await this.deps.userRepository.findByEmail(parsed.email);
    if (existing) {
      this.deps.logger?.warn(
        { email: parsed.email },
        'Registration attempt with already-taken email',
      );
      throw new EmailAlreadyTakenError(parsed.email);
    }

    const id = this.deps.idGenerator.generate();
    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = User.create({ id, email: parsed.email, passwordHash });

    const { raw, hash, expiresAt } = generateRefreshToken();
    await this.deps.userRegistrar.register(user, {
      id: this.deps.idGenerator.generate(),
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    await this.deps.eventDispatcher.dispatch(user.domainEvents);
    user.clearDomainEvents();

    this.deps.logger?.info({ userId: user.id }, 'User registered');
    const accessToken = await this.deps.jwtService.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      refreshToken: raw,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    };
  }
}
