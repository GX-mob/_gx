import { Injectable } from "@nestjs/common";
import { DataService } from "@app/data";
import { SocketService } from "@app/socket";
import { Position } from "../schemas/events/position";
import { Driver } from "../schemas/common/driver";
import { Setup } from "../schemas/events/setup";
import { Connection } from "../schemas/common/connection";
import { ConnectionDataService } from "../conn-data.service";
import EVENTS_MAP from "../schemas/events-map";

type DriversList = {
  [id: string]: Driver;
};

@Injectable()
export class DriversState {
  /**
   * Drivers position list
   */
  public list: DriversList = {};
  /**
   * SocketId to PID reference list
   */
  public socketIdPidRef: { [SocketId: string]: string } = {};

  constructor(
    readonly dataService: DataService,
    readonly socketService: SocketService,
    readonly connectionData: ConnectionDataService,
  ) {
    this.socketService.on<Setup>(
      EVENTS_MAP.SETUP.NAME,
      ({ socketId, data }) => {
        this.setupDriver(socketId, data);
      },
    );

    this.socketService.on<Position>(
      "position",
      ({ socketId, data: position }) => {
        this.setPosition(socketId, position);
      },
    );
  }

  /**
   * Setup driver initial information
   * @param {string} socketId
   * @param {string} pid
   */
  public async setupDriver(
    socketId: string,
    setup: Setup,
    connection?: Connection,
  ) {
    connection = connection || (await this.connectionData.get(socketId));

    this.socketIdPidRef[socketId] = connection.pid;

    this.list[connection.pid] = {
      ...connection,
      position: setup.position,
      config: setup.configuration,
    };
  }

  /**
   * Update driver position
   * @param {string} socketId
   * @param {Position} position
   */
  setPosition(socketId: string, position: Position) {
    //const pid = this.socketIdPidRef[socketId];
    //this.list[pid].position = position;
  }
}
