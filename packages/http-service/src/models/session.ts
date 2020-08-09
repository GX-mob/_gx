import { Document, Schema, Types, model } from "mongoose";
import { User } from "./user";

export interface Session {
  _id: Types.ObjectId | any;
  user: User;
  groups: number[];
  userAgent: string;
  ips: string[];
  createdAt?: Date;
  active?: boolean;
}

export interface SessionDocument extends Session, Document {}

export const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    groups: { type: Array, of: Number, required: true },
    userAgent: { type: String, required: true },
    ips: { type: Array, of: String, required: true },
    createdAt: { type: Date, default: Date.now },
    active: Boolean,
  },
  { collection: "sessions" }
);

/* istanbul ignore next */
SessionSchema.pre<SessionDocument>("save", async function () {
  this.createdAt = new Date();
  this.active = true;
});

export const SessionModel = model<SessionDocument>("Session", SessionSchema);
