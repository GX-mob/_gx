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
import { Document, Schema } from "mongoose";
import { Sessions } from "../connections";
import { ISession } from "@core/domain/session";
import { UserModel } from "./user";

export interface SessionDocument extends ISession, Document {}

export const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: UserModel },
    userAgent: { type: String, required: true },
    ips: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { collection: "sessions" },
);

export const SessionModel = Sessions.model<SessionDocument>(
  "Session",
  SessionSchema,
);
