/**
 * Helpers: geometry: distance
 *
 * @group unit/helpers/geometry/bounds
 */
import * as bounds from "./bounds";
//@ts-ignore
const { decode } = require("google-polyline");

describe("Helpers/Geometry: Distance", () => {
  const pathEncodedMock =
    "_jn~Fh_}uOlIr@dNxCxIOxIgB|HmElEmE~BeI~BsHjAwIh@yHjAkLdDcHxCkDjCwBfFcApCIdDO~B?dDc@dD?";
  const pathDecodedMock = decode(pathEncodedMock);

  const pathMiddleCoord =
    pathDecodedMock[Math.round(pathDecodedMock.length / 2)];

  describe("latLngBounds", () => {
    it("should return bounds", () => {
      const coordsA: [number, number] = [41.87562, -87.61604];
      const coordsB: [number, number] = [41.84622, -87.61329];

      const resultA = bounds.latLngBounds(coordsA, coordsB);
      const resultB = bounds.latLngBounds(coordsA, coordsB);

      expect(resultA).toMatchSnapshot();
      expect(resultB).toMatchSnapshot();
      expect(resultA).toStrictEqual(resultB);
    });
  });

  describe("boundsOfPath", () => {
    it("should return bounds of string path", () => {
      expect(bounds.boundsOfPath(pathEncodedMock)).toMatchSnapshot();
    });
    it("should return bounds of decoded path", () => {
      expect(bounds.boundsOfPath(pathDecodedMock)).toMatchSnapshot();
    });
  });

  describe("boundsOfRunningPath", () => {
    it("should return bounds of string path", () => {
      expect(
        bounds.boundsOfRunningPath(pathEncodedMock, pathMiddleCoord),
      ).toMatchSnapshot();
    });
    it("should return bounds of decoded path", () => {
      expect(
        bounds.boundsOfRunningPath(pathDecodedMock, pathMiddleCoord),
      ).toMatchSnapshot();
    });
  });
});
