import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { PinoLogger } from 'nestjs-pino';
import type { IIdGenerator } from '@/shared/application';
import {
  InvalidCredentialsError,
  type IRefreshTokenRepository,
  type IUserRepository,
} from '@/users/domain';
import type { AuthTokenDTO } from '../dtos/user.dto';
import { generateRefreshToken } from '../helpers/refresh-token.helper';
import { type LoginUserInput, LoginUserInputSchema } from '../schemas/user.schemas';

interface Deps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  idGenerator: IIdGenerator;
  jwtService: JwtService;
  logger?: PinoLogger;
}

export class LoginUserUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginUserInput): Promise<AuthTokenDTO> {
    const parsed = LoginUserInputSchema.parse(input);

    const user = await this.deps.userRepository.findByEmail(parsed.email);
    if (!user) {
      this.deps.logger?.warn('Login attempt for unknown email');
      throw new InvalidCredentialsError();
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      this.deps.logger?.warn({ userId: user.id }, 'Login attempt with wrong password');
      throw new InvalidCredentialsError();
    }

    const { raw, hash, expiresAt } = generateRefreshToken();
    await this.deps.refreshTokenRepository.save({
      id: this.deps.idGenerator.generate(),
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    this.deps.logger?.info({ userId: user.id }, 'User logged in');
    const accessToken = await this.deps.jwtService.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      refreshToken: raw,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    };
  }
}
