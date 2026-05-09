import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { StringValue } from 'ms';
import { PinoLogger } from 'nestjs-pino';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { JwtAuthGuard } from '@/shared/infrastructure/auth/jwt.guard';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { EVENT_DISPATCHER, ID_GENERATOR } from '@/shared/infrastructure/shared.tokens';
import {
  type IUserRegistrar,
  LoginUserUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
} from '@/users/application';
import type { IRefreshTokenRepository, IUserRepository } from '@/users/domain';
import { AuthController } from './http/auth.controller';
import { DrizzleRefreshTokenRepository } from './persistence/drizzle-refresh-token.repository';
import { DrizzleUserRepository } from './persistence/drizzle-user.repository';
import { DrizzleUserRegistrar } from './persistence/drizzle-user-registrar';
import {
  LOGIN_USER_UC,
  REFRESH_TOKEN_REPOSITORY,
  REFRESH_TOKEN_UC,
  REGISTER_USER_UC,
  USER_REGISTRAR,
  USER_REPOSITORY,
} from './tokens';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '7d') as StringValue },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleUserRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleRefreshTokenRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: USER_REGISTRAR,
      useFactory: (db: PostgresJsDatabase) => new DrizzleUserRegistrar(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: REGISTER_USER_UC,
      useFactory: (
        userRepository: IUserRepository,
        userRegistrar: IUserRegistrar,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
        jwtService: JwtService,
        logger: PinoLogger,
      ) =>
        new RegisterUserUseCase({
          userRepository,
          userRegistrar,
          idGenerator,
          eventDispatcher,
          jwtService,
          logger,
        }),
      inject: [
        USER_REPOSITORY,
        USER_REGISTRAR,
        ID_GENERATOR,
        EVENT_DISPATCHER,
        JwtService,
        PinoLogger,
      ],
    },
    {
      provide: LOGIN_USER_UC,
      useFactory: (
        userRepository: IUserRepository,
        refreshTokenRepository: IRefreshTokenRepository,
        idGenerator: IIdGenerator,
        jwtService: JwtService,
        logger: PinoLogger,
      ) =>
        new LoginUserUseCase({
          userRepository,
          refreshTokenRepository,
          idGenerator,
          jwtService,
          logger,
        }),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, ID_GENERATOR, JwtService, PinoLogger],
    },
    {
      provide: REFRESH_TOKEN_UC,
      useFactory: (
        userRepository: IUserRepository,
        refreshTokenRepository: IRefreshTokenRepository,
        idGenerator: IIdGenerator,
        jwtService: JwtService,
        logger: PinoLogger,
      ) =>
        new RefreshTokenUseCase({
          userRepository,
          refreshTokenRepository,
          idGenerator,
          jwtService,
          logger,
        }),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, ID_GENERATOR, JwtService, PinoLogger],
    },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class UsersModule {}
