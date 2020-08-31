declare module "google-polyline" {
  export type Coord = [number, number];
  export type Path = Coord[];

  export function encode(path: Coord[]): string;
  export function decode(path: string): Coord[];
}
