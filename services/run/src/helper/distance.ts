import { toArray, LatLng } from "./lat-lng";
// internal
function calc(a: number, t: number, n: number, h: number): number {
  var r = 0.017453292519943295,
    s = (h - t) * r,
    M = (n - a) * r,
    c = Math.sin(M / 2),
    i = Math.cos(a * r),
    o = Math.sin(s / 2),
    q = c * c + i * i * (o * o);
  return 6368.1 * (2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)));
}

export function calculate(coord1: LatLng, coord2: LatLng, km = false) {
  coord1 = toArray(coord1);
  coord2 = toArray(coord2);
  const distance = calc(coord1[0], coord1[1], coord2[0], coord2[1]);

  return km ? distance : Math.round(distance * 1000);
}
