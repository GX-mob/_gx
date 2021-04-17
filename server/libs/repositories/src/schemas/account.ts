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
import { Entities } from "../connections";
import { IAccount, EAccountRoles, EAccountMode, EAvailableCountries } from "@core/domain/account";
import { VerificationModel } from "./verification";
import { EDatabaseCollectionsNames } from "../constants";

export interface AccountDocument extends IAccount, Document {}

const RolesSchema: Schema = new Schema({
  type: [String],
  enum: Object.values(EAccountRoles)
})

export const AccountSchema: Schema = new Schema<IAccount>(
  {
    pid: { type: String, required: true, unique: true },
    mode: { type: String, enum: Object.values(EAccountMode), default: EAccountMode.ParentAccount },
    parentAccount: { type: Types.ObjectId, ref: "Users" },
    accountVerifications: { type: [Types.ObjectId], ref: VerificationModel, default: [] },
    country: { type: String, enum: Object.values(EAvailableCountries), required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    federalID: {
      type: String,
      required: true,
      unique: true,
    },
    primaryMobilePhone: {
      type: String,
      unique: true,
    },
    secondariesMobilePhones: {
      type: Array,
      of: String,
      default: []
    },
    primaryEmail: {
      type: String,
      unique: true,
    },
    secondariesEmails: {
      type: Array,
      of: String,
      default: [],
    },
    birth: { type: Date, required: true },
    termsAcceptedVersion: { type: String, required: true },
    averageEvaluation: { type: Number, default: 0 },
    avatar: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    roles: { type: [RolesSchema], default: [EAccountRoles.Voyager] },
    password: String,
    ["2fa"]: String,
  },
  { collection: EDatabaseCollectionsNames.Accounts },
);

AccountSchema.pre<AccountDocument>("updateOne", function () {
  this.set({ updatedAt: new Date() });
});

export const AccountModel = Entities.model<AccountDocument>("Users", AccountSchema);
