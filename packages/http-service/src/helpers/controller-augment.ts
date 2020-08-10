import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  HookHandlerDoneFunction,
} from "fastify";
import {
  Hook,
  Inject,
  FastifyInstanceToken,
  ErrorHandler,
} from "fastify-decorators";
import httpError from "http-errors";
import {
  CacheService,
  ContactVerificationService,
  DataService,
  EmailService,
  SessionService,
  StorageService,
} from "../services";
import { getClientIp } from "request-ip";

type Settings = {
  protected?: boolean | number[];
  managedErrors: string[];
};

export class ControllerAugment {
  public settings: Settings = {
    protected: false,
    managedErrors: [],
  };

  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  @Inject(CacheService)
  public cache!: CacheService;

  @Inject(ContactVerificationService)
  public verify!: ContactVerificationService;

  @Inject(DataService)
  public data!: DataService;

  @Inject(EmailService)
  public email!: EmailService;

  @Inject(SessionService)
  public session!: SessionService;

  @Inject(StorageService)
  public storage!: StorageService;

  @Hook("onRequest")
  private async _protectedRequestHook(
    request: FastifyRequest,
    reply: FastifyReply,
    next: HookHandlerDoneFunction
  ) {
    if (!this.settings.protected) {
      return next();
    }

    if (!request.headers.authorization) {
      return reply.send(new httpError.Unauthorized());
    }

    const ip = getClientIp(request.raw);
    const token = request.headers.authorization.replace("Bearer ", "");
    const { session, error } = await this.session.verify(token, ip);

    if (error) {
      throw new httpError.Unauthorized(error);
    }

    if (
      !this.session.hasPermission(session, this.settings.protected as number[])
    ) {
      throw new httpError.Forbidden();
    }

    request.user = session.user;
  }

  /**
   * Used to prevent expose internal errors
   */
  @ErrorHandler()
  private controllerErrorHandler(
    error: Error,
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (this.settings.managedErrors.includes(error.constructor.name)) {
      return reply.send(error);
    }

    this.instance.log.error(error);

    reply.send(httpError(500));
  }
}
