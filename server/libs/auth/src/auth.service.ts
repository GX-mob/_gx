import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import { Types } from "mongoose";
import { EUserRoles } from "@core/domain/user"
import { ISession } from "@core/interfaces";
import { SessionRepository } from "@app/repositories";
import { promisify } from "util";
import jwt, { VerifyOptions, SignOptions, Secret } from "jsonwebtoken";
import { CacheService } from "@app/cache";
import { util } from "@app/helpers";
import {
  SessionNotFoundException,
  SessionDeactivatedException,
} from "./exceptions";
import { UserBasic } from "@core/domain/user";

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
    user: UserBasic,
    userAgent?: string | null,
    ip?: string | null,
  ): Promise<{ token: string; session: ISession }> {
    const session = await this.sessionRepository.insert({
      user: user.getID(),
      userAgent: userAgent || "",
      ips: ip ? [ip] : [],
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
  async verify(token: string, ip: string | null) {
    const tokenBody = await this.verifyToken(token);
    const session_id = Types.ObjectId(tokenBody.sid);

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
    session_id: Types.ObjectId,
    ip: string | null,
  ): Promise<ISession> {
    const sessionData = await this.get(session_id);

    if (!sessionData) {
      throw new SessionNotFoundException();
    }

    if (!sessionData.active) {
      throw new SessionDeactivatedException();
    }

    const session = { ...sessionData };

    if (!ip || session.ips.includes(ip)) {
      return session;
    }

    session.ips.push(ip);

    const update = this.update(session_id, { ips: session.ips });
    util.handleRejectionByUnderHood(update);

    return session;
  }

  public hasPermission(session: ISession, roles: EUserRoles[]) {
    return !!roles.find((role) => session.user.roles.includes(role));
  }

  async get(_id: Types.ObjectId) {
    return this.sessionRepository.find({ _id });
  }

  async update(
    session_id: Types.ObjectId,
    data: Partial<Omit<ISession, "_id" | "user" | "createdAt">>,
  ) {
    await this.sessionRepository.updateByQuery({ _id: session_id }, data);
  }

  async delete(session_id: string) {
    await this.sessionRepository.remove({ _id: session_id });
  }
}
