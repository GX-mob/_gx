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
import { Document, Schema, Types } from "mongoose";
import Connections from "../connections";
import { User } from "./user";
import { UserModel } from "./user";

export interface Session {
  _id: Types.ObjectId | any;
  user: User;
  userAgent: string;
  ips: (string | null)[];
  createdAt?: Date;
  active: boolean;
}

export interface SessionDocument extends Session, Document {}

export const SESSION_MODEL_PROVIDER = "SESSION_MODEL_PROVIDER";

export const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: UserModel },
    userAgent: { type: String, required: true },
    ips: { type: Array, of: String, default: [null] },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { collection: "sessions" },
);

export const SessionModel = Connections.Sessions.model<SessionDocument>(
  "Session",
  SessionSchema,
);
