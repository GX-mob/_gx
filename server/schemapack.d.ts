import { SchemaObject } from "../shared/types/schemapack";
declare module "schemapack" {
  export interface Parser<T = any> {
    encode(object: T): Buffer;
    decode(buff: Buffer): T;
  }

  function build<T = any>(
    schema: SchemaObject<{ [k: string]: any }>,
  ): Parser<T>;
}
