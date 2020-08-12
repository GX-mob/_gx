import { FastifyRequest } from "fastify";
import { Service, Inject } from "fastify-decorators";
import { Types } from "mongoose";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { DataService } from "../data";
import { CacheService } from "../cache";
import { User, Session } from "../../models";
import { getClientIp } from "request-ip";
import { handleRejectionByUnderHood } from "../../helpers/utils";
import HttpError from "http-errors";

const verify = promisify(jwt.verify);
const sign = promisify(jwt.sign);

@Service()
export class SessionService {
  private tokenNamespace = "token";
  private keyid: string;
  private publicKey: string;
  private privateKey: string;

  @Inject(DataService)
  private data!: DataService;

  @Inject(CacheService)
  private cache!: CacheService;

  constructor() {
    this.keyid = process.env.AUTH_KID;
    this.publicKey = process.env.AUTH_PUBLIC_KEY;
    this.privateKey = process.env.AUTH_PRIVATE_KEY;
  }

  /**
   * @param user_id
   * @param session_data Object with userAgent and user IP
   * @return {Object} { token: string, session: SessionModel }
   */
  async create(
    user: User,
    request: FastifyRequest
  ): Promise<{ token: string; session: Session }> {
    const session = await this.data.sessions.create({
      user: user._id,
      userAgent: request.headers["user-agent"],
      ips: [getClientIp(request.raw)],
    });

    const token = await this.signToken({ sid: session._id, uid: user._id });

    return { token, session };
  }

  private signToken(data: any): Promise<string> {
    if (!this.privateKey) {
      throw new Error(
        "This service does not have the private key," +
          " isn't allowed to sign an authentication token"
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
  async verify(token: string, ip: string) {
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
    handleRejectionByUnderHood(setCache);

    return tokenBody;
  }

  private async checkState(
    session_id: Types.ObjectId,
    ip: string
  ): Promise<Session> {
    const sessionData = await this.get(session_id);

    if (!sessionData) {
      throw new HttpError.Unauthorized("not-found");
    }

    if (!sessionData.active) {
      throw new HttpError.Forbidden("deactivated");
    }

    const session = { ...sessionData };

    if (session.ips.includes(ip)) {
      return session;
    }

    session.ips.push(ip);

    const update = this.update(session_id, { ips: session.ips });
    handleRejectionByUnderHood(update);

    return session;
  }

  public hasPermission(session: Session, group: number[]) {
    return !!group.find((id) => session.user.groups.includes(id));
  }

  async get(_id: Types.ObjectId) {
    return this.data.sessions.get({ _id });
  }

  async update(
    session_id: Types.ObjectId,
    data: Omit<Partial<Session>, "_id">
  ) {
    await this.data.sessions.update({ _id: session_id }, data);
  }

  async delete(session_id: Types.ObjectId) {
    await this.data.sessions.remove({ _id: session_id });
  }
}
