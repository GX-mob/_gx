import { Document, Schema, model } from "mongoose";
import shortid from "shortid";
import { User } from "./user";

export interface Pendencie {
  pid: string;
  ride: string;
  issuer: User["_id"];
  amount: number;
  affected: User["_id"];
}

export interface PendencieDocument extends Pendencie, Document {}

export const PendencieSchema: Schema = new Schema(
  {
    pid: { Type: String, default: shortid.generate },
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    issuer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    affected: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: Number,
  },
  { collection: "pendencies" }
);

export const PendencieModel = model<PendencieDocument>("Ride", PendencieSchema);

/**
 * Pendencias são geradas em cancelamentos.
 *
 * Quando uma pendência é gerada, o valor é cobrado do emissor
 * e quando resolvida é passada ao afetado como crédito na plataforma.
 *
 */
