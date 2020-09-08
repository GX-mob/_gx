import { schema as position, Position } from "./position";
import { schema as configuration, Configuration } from "./configuration";

export type Setup = {
  position: Position;
  configuration: Configuration;
};

export default {
  id: 0,
  schema: {
    position,
    configuration,
  },
};
