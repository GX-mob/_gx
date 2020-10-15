/**
 * Storage Service
 *
 * @group unit/services/storage
 */
import { Test, TestingModule } from "@nestjs/testing";
import { readFileSync } from "fs";
import { join } from "path";
import { StorageService } from "./storage.service";
import { GoogleStorageService } from "./google-storage.service";
import StorageMock from "./mock/gcp-storage.mock";
//@ts-ignore
import { ReadableStreamBuffer } from "stream-buffers";

describe("StorageService", () => {
  let service: StorageService;

  const jpegBuffer = readFileSync(join(__dirname, "mock", "mock.jpeg"));
  const pngBuffer = readFileSync(join(__dirname, "mock", "mock.png"));

  function createReadableFrom(buffer: Buffer, stop: boolean = true) {
    const readable = new ReadableStreamBuffer();
    readable.put(Buffer.from(buffer));
    stop && readable.stop();
    return readable;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleStorageService, StorageService],
    })
      .overrideProvider(GoogleStorageService)
      .useValue({ client: new StorageMock() })
      .compile();

    service = module.get<StorageService>(StorageService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("set stream errorHandler", async (done) => {
    const stream = createReadableFrom(pngBuffer, false);

    setTimeout(() => stream.destroy(new Error("test")), 100);

    service.uploadStream("test", stream, {
      filename: "avatar.png",
      public: true,
      acceptMIME: ["image/jpeg", "image/png"],
      errorHandler: (error) => {
        expect(error.message).toBe("test");
        done();
      },
    });
  });

  it("should throw error due to cannot detect the MIME type of stream", async () => {
    const readable = new ReadableStreamBuffer();

    new Array(1000).map((i) => readable.put(i));
    readable.stop();

    try {
      await service.uploadStream("test", readable, {
        filename: "avatar.jpg",
        public: true,
        acceptMIME: ["image/png", "image/jpeg"],
        errorHandler(error) {},
      });
    } catch (e) {
      expect(e.message).toBe("Cannot detect the MIME type");
    }
  });

  it("should throw error due to non-acceptable mime type", async () => {
    try {
      const image = createReadableFrom(pngBuffer);
      await service.uploadStream("test", image, {
        filename: "avatar.png",
        public: true,
        acceptMIME: ["image/jpeg"],
        errorHandler(error) {},
      });
    } catch (e) {
      expect(e.message).toBe(
        "MIME type not acceptable, provided: image/png, accepts: image/jpeg",
      );
    }
  });

  it("should upload and don't compress", async (done) => {
    const image = createReadableFrom(pngBuffer);
    const { bucketFile } = await service.uploadStream("test", image, {
      filename: "avatar.png",
      public: true,
      acceptMIME: ["image/jpeg", "image/png"],
      errorHandler(error) {},
    });

    (bucketFile as any).writable.on("finish", () => {
      expect(
        (bucketFile as any).contents.length === pngBuffer.length,
      ).toBeTruthy();
      done();
    });
  });

  it("should upload", async (done) => {
    const image = createReadableFrom(pngBuffer);
    const { bucketFile } = await service.uploadStream("test", image, {
      filename: "avatar.png",
      public: true,
      acceptMIME: ["image/jpeg", "image/png"],
      errorHandler(error) {},
    });

    (bucketFile as any).writable.on("finish", () => {
      expect(
        (bucketFile as any).contents.length < pngBuffer.length,
      ).toBeTruthy();
      done();
    });
  });
});
