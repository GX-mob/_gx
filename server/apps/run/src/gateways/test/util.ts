import faker from "faker";
import deepmerge from "deepmerge";
import { EVENTS } from "../../events";
import { RidePayMethods } from "@app/repositories";

export function mockSocket(override: any = {}) {
  return deepmerge(
    {
      id: faker.random.alphaNumeric(12),
      state: 0,
      data: {
        _id: faker.random.alphaNumeric(12),
        pid: faker.random.alphaNumeric(12),
        p2p: true,
        observers: [
          {
            socketId: faker.random.alphaNumeric(12),
            p2p: false,
          },
          {
            socketId: faker.random.alphaNumeric(12),
            p2p: true,
          },
        ],
      },
    },
    override,
  );
}

export function mockRide(override: any = {}) {
  return {
    _id: faker.random.alphaNumeric(12),
    pid: faker.random.alphaNumeric(12),
    voyager: { _id: faker.random.alphaNumeric(12) },
    driver: { _id: faker.random.alphaNumeric(12) },
    payMethod: RidePayMethods.Money,
    ...override,
  };
}

export function expectObservableFor(
  socketMock: any,
  event: EVENTS,
  eventBody: any,
  socketServiceMock: any,
) {
  socketMock.data.observers.forEach((observer: any, index: number) => {
    const emitCall = socketServiceMock.emit.mock.calls[index];

    if (observer.p2p) {
      return expect(emitCall).toBeUndefined();
    }

    expect(emitCall[0]).toBe(observer.socketId);
    expect(emitCall[1]).toBe(event);
    expect(emitCall[2]).toMatchObject({
      ...eventBody,
      pid: socketMock.data.pid,
    });
  });
}
