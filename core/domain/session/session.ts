import { EUserRoles } from "../user";
import { SessionBase } from "./session.base";
import { SessionDeactivatedException } from "./session.exceptions";
import { ESessionActions, ISession } from "./session.types";

export class Session extends SessionBase {
  constructor(session: ISession){
    super(session);
    this.validate();
  }

  validate() {
    if(!this.data.active){
      throw new SessionDeactivatedException();
    }
  }

  addIp(ip: string) {
    if(this.data.ips.includes(ip)) return;

    this.data.ips.push(ip);
    this.addHistory(ESessionActions.IpAdded);
  }

  deactive() {
    this.data.active = false;
    this.addHistory(ESessionActions.Deactivated);
  }

  public hasPermission(roles: EUserRoles[]) {
    return !!roles.find((role) => this.data.user.roles.includes(role));
  }

  private addHistory(action: ESessionActions) {
    this.data.history.push({
      action,
      date: new Date()
    });
  }
}