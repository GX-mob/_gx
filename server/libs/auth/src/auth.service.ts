import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import { Types } from "mongoose";
import { SessionRepository } from "@app/repositories";
import { promisify } from "util";
import jwt, { VerifyOptions, SignOptions, Secret } from "jsonwebtoken";
import { CacheService } from "@app/cache";
import { util } from "@app/helpers";
import {
  SessionNotFoundException,
  SessionDeactivatedException,
} from "./exceptions";
import { EUserRoles, User } from "@core/domain/user";
import { ISession, Session } from "@core/domain/session";

const verify = promisify<string, Secret, VerifyOptions, object | string>(
  jwt.verify,
);
const sign = promisify<string | Buffer | object, Secret, SignOptions, string>(
  jwt.sign,
);

@Injectable()
export class AuthService {
  private tokenNamespace = "token";
  private keyid: string;
  private publicKey: string;
  private privateKey: string;

  constructor(
    private configService: ConfigService,
    private sessionRepository: SessionRepository,
    private cache: CacheService,
    readonly logger: PinoLogger,
  ) {
    logger.setContext(AuthService.name);

    this.keyid = this.configService.get("AUTH_KID") as string;
    this.publicKey = this.configService.get("AUTH_PUBLIC_KEY") as string;
    this.privateKey = this.configService.get("AUTH_PRIVATE_KEY") as string;
  }

  /**
   * @param user_id
   * @param userAgent
   * @param ip
   * @return {Object} { token: string, session: SessionModel }
   */
  async create(
    user: User,
    userAgent?: string | null,
    ip?: string | null,
  ): Promise<{ token: string; session: ISession }> {
    const session = await this.sessionRepository.insert({
      user: user.getID(),
      userAgent: userAgent || "",
      ips: ip ? [ip] : [],
      history: [],
    });

    const token = await this.signToken({ sid: session._id, uid: user.getID() });

    return { token, session };
  }

  private signToken(data: any): Promise<string> {
    return sign({ ...data }, this.privateKey, {
      algorithm: "ES256",
      keyid: this.keyid,
    });
  }

  /**
   * Verify a token
   * @param token
   * @returns session data
   */
  async verify(token: string, ip?: string) {
    const tokenBody = await this.verifyToken(token);
    const session_id = tokenBody.sid;

    return this.checkState(session_id, ip);
  }

  private async verifyToken(token: string): Promise<any> {
    const cache = await this.cache.get(this.tokenNamespace, token);

    if (cache) {
      return cache;
    }

    const tokenBody = await verify(token, this.publicKey, {
      algorithms: ["ES256"],
    });

    const setCache = this.cache.set(this.tokenNamespace, token, tokenBody);
    util.handleRejectionByUnderHood(setCache);

    return tokenBody;
  }

  private async checkState(
    session_id: string,
    ip?: string,
  ): Promise<Session> {
    const session = await this.get(session_id);

    ip && session.addIp(ip);

    util.handleRejectionByUnderHood(this.update(session));

    return session;
  }

  public hasPermission(session: ISession, roles: EUserRoles[]) {
    return !!roles.find((role) => session.user.roles.includes(role));
  }

  async get(_id: string): Promise<Session> {
    const sessionData = await this.sessionRepository.find({ _id });

    if (!sessionData) {
      throw new SessionNotFoundException();
    }

    return new Session(sessionData);
  }

  async update(session: Session) {
    await this.sessionRepository.update(session);
  }

  async delete(session_id: string) {
    await this.sessionRepository.remove({ _id: session_id });
  }
}
