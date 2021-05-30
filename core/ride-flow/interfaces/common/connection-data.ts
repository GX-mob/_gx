import { type } from "@colyseus/schema";
import { EAccountRoles } from "../../../domain/account";
import { ConfigurationSchema, IConfiguration } from "../configuration";
import { IObserver, ObserverSchema } from "./observer";
import { IUserBasic, UserDataSchema } from "./user-basic";

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

export class ConnectionDataSchema
  extends UserDataSchema
  implements IConnectionData
{
  @type("string")
  mode!: EAccountRoles;

  @type([ObserverSchema])
  observers!: ObserverSchema[];

  @type(ConfigurationSchema)
  config!: ConfigurationSchema;

  @type(["string"])
  rides!: string[];
}
