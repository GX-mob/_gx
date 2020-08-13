declare module "jpegtran" {
  import { Duplex } from "stream";
  declare class JpegTran extends Duplex {
    constructor(options?: string[]);
  }

  export default JpegTran;
}
