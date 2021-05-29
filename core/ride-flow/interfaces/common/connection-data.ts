import { configurationSchema, IConfiguration } from "../configuration";
import { IUserBasic, userSchema } from "./user-basic";
import { EAccountRoles } from "../../../domain/account";
import { SchemaObject } from "../../../types/schemapack";
import { IObserver, observerSchema } from "./observer";

export interface IConnectionData extends IUserBasic {
  mode: EAccountRoles;
  /**
   * Sockets that observe some events of this socket
   */
  observers: IObserver[];
  config?: IConfiguration;
  /**
   * Running user rides
   */
  rides: string[];
}

export const connectionDataSchema: SchemaObject<IConnectionData> = {
  ...userSchema,
  mode: "string",
  observers: [observerSchema],
  config: configurationSchema,
  rides: ["string"],
};
