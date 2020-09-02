declare module "jpegtran" {
  import { Duplex } from "stream";

  class JpegTran extends Duplex {
    constructor(options?: string[]);
  }

  export default JpegTran;
}
