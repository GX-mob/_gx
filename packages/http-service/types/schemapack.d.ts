declare module "schemapack" {
  export interface Parser<T = any> {
    encode(object: T): Buffer;
    decode(buff: Buffer): T;
  }

  export type Types =
    | "bool"
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

  export interface SchemaObject {
    [k: string]: Types | Types[] | SchemaObject | SchemaObject[];
  }

  function build<T = any>(schema: SchemaObject): Parser<T>;
}
