import { Document, Schema, Types } from "mongoose";
import { Entities } from "../connections";
import { EVerificationType, EVerificationStatus, IVerification } from "@core/domain/verification";
import { UserModel } from "./user";

export interface IVerificationDocument extends IVerification, Document {}

export const VerificationHistory: Schema = new Schema({
  authorId: { type: Types.ObjectId, ref: UserModel, required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: Object.values(EVerificationStatus) }
});

export const VerificationSchema: Schema = new Schema(
  {
    mode: { type: String, required: true, enum: Object.values(EVerificationType) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    lastStatus: { type: String, enum: Object.values(EVerificationStatus) },
    documentsURI: [String],
    history: { type: [VerificationHistory], default: [] }
  },
  { collection: "accounts-verifications" },
);

export const VerificationModel = Entities.model<IVerificationDocument>(
  "Verification",
  VerificationSchema,
);
