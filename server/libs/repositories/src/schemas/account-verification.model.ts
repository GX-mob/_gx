import { Document, Schema } from "mongoose";
import { Entities } from "../connections";
import { UserModel } from "./user";
import { EAccountVerificationMode, EAccountVerificationStatus, IAccountVerification } from "@core/interfaces/models/account-verifications.interface";

export interface IAccountVerificationDocument extends IAccountVerification, Document {}

export const AccountVerificationSchema: Schema = new Schema(
  {
    mode: { type: String, required: true, enum: Object.values(EAccountVerificationMode) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    status: { type: String, enum: Object.values(EAccountVerificationStatus) },
    documentsURI: [String]
  },
  { collection: "accounts-verifications" },
);

export const AccountVerificationModel = Entities.model<IAccountVerificationDocument>(
  "AccountVerification",
  AccountVerificationSchema,
);
