declare module "schemapack" {
  interface Parser<T = any> {
    encode(object: T): Buffer;
    decode(buff: Buffer): T;
  }

  type Types =
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

  interface SchemaObject {
    [k: string]: Types | Types[] | SchemaObject;
  }

  declare function build<T = any>(schema: SchemaObject): Parser<T>;
}
