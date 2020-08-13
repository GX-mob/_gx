declare module "pngquant" {
  import { Duplex } from "stream";
  export default class PngQuant extends Duplex {
    constructor(options?: [number, ...string]);
  }
}
