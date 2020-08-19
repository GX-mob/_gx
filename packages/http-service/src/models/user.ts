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
import { Document, Schema, Types, model } from "mongoose";
import bcrypt from "bcrypt";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import { emailRegex, internationalMobilePhoneRegex } from "../helpers/utils";
import shortid from "shortid";

export interface User {
  _id: any;
  /**
   * Public ID
   */
  pid: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phones: string | string[];
  birth: Date;
  averageEvaluation: number;
  avatar?: string;
  emails?: string | string[];
  createdAt?: Date;
  updatedAt?: Date;
  groups?: number[];
  password?: string;
  ["2fa"]?: string;
}

export interface UserDocument extends User, Document {}

export interface UserModel extends UserDocument {
  compareCredential(plain: string): Promise<boolean>;
}

export const UserSchema: Schema = new Schema(
  {
    pid: { type: String, default: shortid.generate },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    cpf: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator(v: string) {
          return isValidCPF(v);
        },
        message(props) {
          return `${props.value} isn't a valid cpf`;
        },
      },
    },
    phones: {
      type: Array,
      of: String,
      validate: {
        /**
         * Validate all mobile phone numbers in the list
         */
        validator: (v: string[]) =>
          v.filter((phone) => internationalMobilePhoneRegex.test(phone))
            .length === v.length,
        message: (props) => `${props.value} has an invalid mobile phone`,
      },
      required: true,
      unique: true,
    },
    emails: {
      type: Array,
      of: String,
      validate: {
        /**
         * Validate all emails in the list
         */
        validator: (v: string[]) =>
          v.length === 0 || // empty
          v.filter((email) => emailRegex.test(email)).length === v.length,
        message: (props) => `${props.value} has an invalid email`,
      },
      default: [],
    },
    avatar: String,
    averageEvaluation: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    birth: { type: Date, required: true },
    groups: { type: Array, of: Number, default: [1] },
    password: String,
    ["2fa"]: String,
  },
  { collection: "users" }
);

UserSchema.pre<UserDocument>("updateOne", async function () {
  this.set({ updatedAt: new Date() });
});

export const UserModel = model<UserModel>("User", UserSchema);
