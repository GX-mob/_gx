/**
 * Helpers: geometry: distance
 *
 * @group unit/helpers/geometry/distance
 */
import * as distance from "./distance";
//@ts-ignore
const { decode } = require("google-polyline");

describe("Helpers/Geometry: Distance", () => {
  const pathEncodedMock =
    "_jn~Fh_}uOlIr@dNxCxIOxIgB|HmElEmE~BeI~BsHjAwIh@yHjAkLdDcHxCkDjCwBfFcApCIdDO~B?dDc@dD?";
  const pathDecodedMock = decode(pathEncodedMock);

  describe("path", () => {
    it("calculate full distance by string path", () => {
      expect(distance.path(pathEncodedMock)).toMatchSnapshot();
    });

    it("calculate full distance by decoded path", () => {
      expect(distance.path(pathDecodedMock)).toMatchSnapshot();
    });

    it("calculate specifying an index start point", () => {
      expect(distance.path(pathDecodedMock, 5)).toMatchSnapshot();
    });

    it("calculate specifying an index limit point", () => {
      expect(distance.path(pathDecodedMock, 0, 5)).toMatchSnapshot();
    });
  });

  describe("meterToKM", () => {
    it("should convert", () => {
      expect(distance.meterToKM(2345)).toBe(2.345);
      expect(distance.meterToKM(2346)).toBe(2.346);
      expect(distance.meterToKM(2347)).toBe(2.347);
    });
  });
});
