import { Document, Schema, Types, model } from "mongoose";
import { User } from "./user";

export interface Session {
  _id: Types.ObjectId | any;
  user: User;
  userAgent: string;
  ips: string[];
  createdAt?: Date;
  active?: boolean;
}

export interface SessionDocument extends Session, Document {}

export const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    userAgent: { type: String, required: true },
    ips: { type: Array, of: String, required: true },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { collection: "sessions" }
);

export const SessionModel = model<SessionDocument>("Session", SessionSchema);
