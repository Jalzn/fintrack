import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { parseInput } from '@/shared/infrastructure';
import type {
  LoginUserUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  UserDTO,
} from '@/users/application';
import {
  LoginUserInputSchema,
  RefreshTokenInputSchema,
  RegisterUserInputSchema,
} from '@/users/application';
import { LOGIN_USER_UC, REFRESH_TOKEN_UC, REGISTER_USER_UC } from '../tokens';

const RT_COOKIE = 'rt';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

interface AuthResponse {
  accessToken: string;
  user: UserDTO;
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(REGISTER_USER_UC) private readonly registerUser: RegisterUserUseCase,
    @Inject(LOGIN_USER_UC) private readonly loginUser: LoginUserUseCase,
    @Inject(REFRESH_TOKEN_UC) private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  private setRefreshCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(RT_COOKIE, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  @Post('register')
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.registerUser.execute(parseInput(RegisterUserInputSchema, body));
    this.setRefreshCookie(reply, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.loginUser.execute(parseInput(LoginUserInputSchema, body));
    this.setRefreshCookie(reply, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const rawToken = request.cookies[RT_COOKIE];
    if (rawToken === undefined) throw new UnauthorizedException();

    const result = await this.refreshToken.execute(
      parseInput(RefreshTokenInputSchema, { refreshToken: rawToken }),
    );
    this.setRefreshCookie(reply, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }
}
