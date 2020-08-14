declare module "pngquant" {
  import { Duplex } from "stream";

  class PngQuant extends Duplex {
    constructor(options?: [number, ...string]);
  }

  export default PngQuant;
}
