import type { JwtService } from '@nestjs/jwt';
import type { PinoLogger } from 'nestjs-pino';
import type { IIdGenerator } from '@/shared/application';
import {
  InvalidCredentialsError,
  type IRefreshTokenRepository,
  type IUserRepository,
} from '@/users/domain';
import type { AuthTokenDTO } from '../dtos/user.dto';
import { generateRefreshToken, hashRefreshToken } from '../helpers/refresh-token.helper';
import { type RefreshTokenInput, RefreshTokenInputSchema } from '../schemas/user.schemas';

interface Deps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  idGenerator: IIdGenerator;
  jwtService: JwtService;
  logger?: PinoLogger;
}

export class RefreshTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokenDTO> {
    const parsed = RefreshTokenInputSchema.parse(input);

    const tokenHash = hashRefreshToken(parsed.refreshToken);
    const stored = await this.deps.refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      this.deps.logger?.warn('Invalid or expired refresh token used');
      throw new InvalidCredentialsError();
    }

    const user = await this.deps.userRepository.findById(stored.userId);
    if (!user) throw new InvalidCredentialsError();

    // Token rotation: delete old, issue new
    await this.deps.refreshTokenRepository.deleteById(stored.id);
    const { raw, hash, expiresAt } = generateRefreshToken();
    await this.deps.refreshTokenRepository.save({
      id: this.deps.idGenerator.generate(),
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    this.deps.logger?.info({ userId: user.id }, 'Access token refreshed');
    const accessToken = await this.deps.jwtService.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      refreshToken: raw,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    };
  }
}
