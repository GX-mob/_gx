import EVENTS_MAP from "../events-map";
import { positionSchema, Position } from "./position";
import { configurationSchema, Configuration } from "./configuration";

export type Setup = {
  position: Position;
  configuration: Configuration;
};

export default {
  id: EVENTS_MAP.SETUP.ID,
  schema: {
    position: positionSchema,
    configuration: configurationSchema,
  },
};
