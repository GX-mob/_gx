import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { getClientIp } from "request-ip";
import { FastifyRequest } from "fastify";
import { UserRoles } from "@shared/interfaces";
import { ROLES_METATADA_KEY } from "./constants";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private sessionService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<UserRoles[]>(
      ROLES_METATADA_KEY,
      context.getHandler(),
    ) || [UserRoles.VOYAGER];

    const request: FastifyRequest = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      throw new UnauthorizedException();
    }

    const ip = getClientIp(request.raw);
    const token = request.headers.authorization.replace("Bearer ", "");
    const session = await this.sessionService.verify(token, ip);

    if (roles && !this.sessionService.hasPermission(session, roles)) {
      throw new ForbiddenException();
    }

    (request as any).session = session;
    return true;
  }
}
