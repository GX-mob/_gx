/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { FastifyRequest } from "fastify";
import { Service, Inject } from "fastify-decorators";
import { Types } from "mongoose";
import { promisify } from "util";
import jwt, { VerifyOptions, SignOptions, Secret } from "jsonwebtoken";
import { DataService } from "../data";
import { CacheService } from "../cache";
import { User, Session } from "../../models";
import { getClientIp } from "request-ip";
import { handleRejectionByUnderHood } from "../../helpers/utils";
import HttpError from "http-errors";

const verify = promisify<string, Secret, VerifyOptions, object | string>(
  jwt.verify
);
const sign = promisify<string | Buffer | object, Secret, SignOptions, string>(
  jwt.sign
);

@Service()
export class SessionService {
  private tokenNamespace = "token";
  private keyid = process.env.AUTH_KID as string;
  private publicKey = process.env.AUTH_PUBLIC_KEY as string;
  private privateKey = process.env.AUTH_PRIVATE_KEY as string;

  @Inject(DataService)
  private data!: DataService;

  @Inject(CacheService)
  private cache!: CacheService;

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
      userAgent: request.headers["user-agent"] as string,
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
    handleRejectionByUnderHood(setCache);

    return tokenBody;
  }

  private async checkState(
    session_id: Types.ObjectId,
    ip: string | null
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
    handleRejectionByUnderHood(update);

    return session;
  }

  public hasPermission(session: Session, group: number[]) {
    return !!group.find((id) => (session.user.groups as number[]).includes(id));
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
