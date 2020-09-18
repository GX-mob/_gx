declare module "schemapack" {
  export interface Parser<T = any> {
    encode(object: T): Buffer;
    decode(buff: Buffer): T;
  }

  export type Types =
    | "bool"
    | "boolean"
    | "int8"
    | "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "float32"
    | "float64"
    | "string"
    | "varuint"
    | "varint"
    | "buffer";

  export type SchemaObject<T> = {
    [K in keyof T]: Types | Array<Types> | SchemaObject<T[K]>;
  };

  function build<T = any>(
    schema: SchemaObject<{ [k: string]: any }>,
  ): Parser<T>;
}
