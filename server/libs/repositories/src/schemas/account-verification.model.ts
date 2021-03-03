import { Document, Schema } from "mongoose";
import { Entities } from "../connections";
import { EAccountVerificationType, EAccountVerificationStatus, IAccountVerification } from "@core/interfaces/models/account-verifications.interface";

export interface IAccountVerificationDocument extends IAccountVerification, Document {}

export const AccountVerificationSchema: Schema = new Schema(
  {
    mode: { type: String, required: true, enum: Object.values(EAccountVerificationType) },
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
