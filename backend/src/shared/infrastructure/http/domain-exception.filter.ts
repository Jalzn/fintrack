import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { PinoLogger } from 'nestjs-pino';
import {
  CategoryHasSubcategoriesError,
  CategoryInUseError,
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
  SubcategoryInUseError,
  SubcategoryNameAlreadyExistsError,
} from '@/transactions/application';
import {
  CategoryNotFoundError,
  InvalidCategoryError,
  InvalidSubcategoryError,
  InvalidTransactionError,
  SubcategoryNotFoundError,
  TransactionNotFoundError,
} from '@/transactions/domain';
import { EmailAlreadyTakenError, InvalidCredentialsError } from '@/users/domain';

@Injectable()
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      void reply.status(exception.getStatus()).send(exception.getResponse());
      return;
    }

    if (
      exception instanceof TransactionNotFoundError ||
      exception instanceof CategoryNotFoundError ||
      exception instanceof SubcategoryNotFoundError
    ) {
      void reply.status(HttpStatus.NOT_FOUND).send({
        statusCode: 404,
        message: exception.message,
        error: exception.code,
      });
      return;
    }

    if (
      exception instanceof InvalidTransactionError ||
      exception instanceof InvalidCategoryError ||
      exception instanceof InvalidSubcategoryError ||
      exception instanceof InvalidCategoryReferenceError ||
      exception instanceof InvalidSubcategoryReferenceError ||
      exception instanceof SubcategoryCategoryMismatchError
    ) {
      void reply.status(HttpStatus.BAD_REQUEST).send({
        statusCode: 400,
        message: exception.message,
        error: exception.code,
      });
      return;
    }

    if (exception instanceof CategoryInUseError) {
      void reply.status(HttpStatus.CONFLICT).send({
        statusCode: 409,
        message: exception.message,
        error: exception.code,
        transactionCount: exception.transactionCount,
      });
      return;
    }

    if (exception instanceof CategoryHasSubcategoriesError) {
      void reply.status(HttpStatus.CONFLICT).send({
        statusCode: 409,
        message: exception.message,
        error: exception.code,
        subcategoryCount: exception.subcategoryCount,
      });
      return;
    }

    if (exception instanceof SubcategoryInUseError) {
      void reply.status(HttpStatus.CONFLICT).send({
        statusCode: 409,
        message: exception.message,
        error: exception.code,
        transactionCount: exception.transactionCount,
      });
      return;
    }

    if (exception instanceof SubcategoryNameAlreadyExistsError) {
      void reply.status(HttpStatus.CONFLICT).send({
        statusCode: 409,
        message: exception.message,
        error: exception.code,
      });
      return;
    }

    if (exception instanceof EmailAlreadyTakenError) {
      void reply.status(HttpStatus.CONFLICT).send({
        statusCode: 409,
        message: exception.message,
        error: exception.code,
      });
      return;
    }

    if (exception instanceof InvalidCredentialsError) {
      void reply.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: 401,
        message: 'Invalid credentials',
        error: exception.code,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception : { err: exception },
      'Unhandled exception',
    );
    void reply
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send({ statusCode: 500, message: 'Internal server error' });
  }
}
