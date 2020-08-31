import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { promisify } from "util";
import jwt, { VerifyOptions, SignOptions, Secret } from "jsonwebtoken";
import { DataService } from "@app/data";
import { CacheService } from "@app/cache";
import { User, Session } from "@app/database";
import { util } from "@app/helpers";
import HttpError from "http-errors";

const verify = promisify<string, Secret, VerifyOptions, object | string>(
  jwt.verify,
);
const sign = promisify<string | Buffer | object, Secret, SignOptions, string>(
  jwt.sign,
);

@Injectable()
export class SessionService {
  private tokenNamespace = "token";
  private keyid = process.env.AUTH_KID as string;
  private publicKey = process.env.AUTH_PUBLIC_KEY as string;
  private privateKey = process.env.AUTH_PRIVATE_KEY as string;

  constructor(private data: DataService, private cache: CacheService) {}

  /**
   * @param user_id
   * @param userAgent
   * @param ip
   * @return {Object} { token: string, session: SessionModel }
   */
  async create(
    user: User,
    userAgent: string | null,
    ip: string | null,
  ): Promise<{ token: string; session: Session }> {
    const session = await this.data.sessions.create({
      user: user._id,
      userAgent: userAgent || "",
      ips: ip ? [ip] : [],
    });

    const token = await this.signToken({ sid: session._id, uid: user._id });

    return { token, session };
  }

  private signToken(data: any): Promise<string> {
    if (!this.privateKey) {
      throw new Error(
        "This service does not have the private key," +
          " isn't allowed to sign an authentication token",
      );
    }

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
  ): Promise<Session> {
    const sessionData = await this.get(session_id);

    if (!sessionData) {
      throw new HttpError.Unauthorized("not-found");
    }

    if (!sessionData.active) {
      throw new HttpError.Forbidden("deactivated");
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

  public hasPermission(session: Session, roles: string[]) {
    return !!roles.find(role =>
      (session.user.roles as string[]).includes(role),
    );
  }

  async get(_id: Types.ObjectId) {
    return this.data.sessions.get({ _id });
  }

  async update(
    session_id: Types.ObjectId,
    data: Omit<Partial<Session>, "_id">,
  ) {
    await this.data.sessions.update({ _id: session_id }, data);
  }

  async delete(session_id: Types.ObjectId) {
    await this.data.sessions.remove({ _id: session_id });
  }
}
