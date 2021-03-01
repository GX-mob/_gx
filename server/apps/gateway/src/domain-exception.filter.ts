import { DomainException } from "@core/domain/base-classes/domain.exception";
import { InvalidRideTypeException, UnsupportedAreaException } from "@core/domain/ride";
import {
  InvalidFederalIDException,
  NotOwnContactException,
  PasswordRequiredException,
  RemoveContactNotAllowed,
  WrongPasswordException,
} from "@core/domain/user";
import { InvalidContactException } from "@core/domain/value-objects/contact.value-object";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch(HttpException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      return reply.status(exception.getStatus()).send(exception.getResponse());
    }

    if (exception instanceof DomainException) {
      switch (true) {
        case exception instanceof PasswordRequiredException:
        case exception instanceof NotOwnContactException:
        case exception instanceof WrongPasswordException:
        case exception instanceof InvalidContactException:
        case exception instanceof InvalidFederalIDException:
        case exception instanceof RemoveContactNotAllowed:
        case exception instanceof InvalidRideTypeException:
        case exception instanceof UnsupportedAreaException:
          throw new UnprocessableEntityException(exception.message);
      }
      1;
    }

    reply.send(exception);
  }
}
