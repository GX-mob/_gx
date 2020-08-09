import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Hook, Inject, FastifyInstanceToken } from "fastify-decorators";
import httpError from "http-errors";
import { SessionService, DataService } from "../services";
import { getClientIp } from "request-ip";

type AuthSettings = {
  groups: number[];
};

export class AuthMiddleware {
  @Inject(FastifyInstanceToken)
  private _instance!: FastifyInstance;

  @Inject(SessionService)
  private _session!: SessionService;

  @Inject(DataService)
  private _data!: DataService;

  public authSettings: AuthSettings = {
    groups: [1],
  };

  @Hook("onRequest")
  private async _protectedRequestHook(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      if (!request.headers.authorization) {
        return reply.send(new httpError.Unauthorized());
      }

      const ip = getClientIp(request.raw);
      const token = request.headers.authorization.replace("Bearer ", "");
      const { session, error } = await this._session.verify(token, ip);

      if (error) {
        return reply.send(new httpError.Unauthorized(error));
      }

      if (!this._session.hasPermission(session, this.authSettings.groups)) {
        return reply.send(new httpError.Forbidden());
      }

      request.user = session.user;
    } catch (error) {
      this._instance.log.error(error);
      return reply.send(httpError(500));
    }
  }
}
