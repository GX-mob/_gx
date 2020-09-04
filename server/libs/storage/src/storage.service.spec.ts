/**
 * Storage Service
 *
 * @group unit/services/storage
 */
import { Test, TestingModule } from "@nestjs/testing";
import { readFileSync } from "fs";
import { join } from "path";
import { StorageService, AbstractionBucket } from "./storage.service";
import { GoogleStorageService } from "./google-storage.service";
import StorageMock from "./mock/gcp-storage.mock";
//@ts-ignore
import { ReadableStreamBuffer, WritableStreamBuffer } from "stream-buffers";

describe("StorageService", () => {
  let service: StorageService;

  const jpegBuffer = readFileSync(join(__dirname, "mock", "mock.jpeg"));
  const pngBuffer = readFileSync(join(__dirname, "mock", "mock.png"));

  function createReadableFrom(buffer: Buffer) {
    const readable = new ReadableStreamBuffer();
    readable.put(buffer);
    readable.stop();
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
    const stream = createReadableFrom(pngBuffer);
    setTimeout(() => stream.destroy(new Error("test")), 20);

    service.uploadStream("test", stream, {
      filename: "avatar.png",
      public: true,
      compress: true,
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
        compress: true,
        acceptMIME: ["image/png", "image/jpeg"],
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
        compress: true,
        acceptMIME: ["image/jpeg"],
      });
    } catch (e) {
      expect(e.message).toBe(
        "MIME type not acceptable, provided: image/png, accepts: image/jpeg",
      );
    }
  });

  it("should compress png file", (done) => {
    const readable = createReadableFrom(pngBuffer);
    const writable = new WritableStreamBuffer();
    const compressor = service.createCompressor("image/png");

    readable.pipe(compressor).pipe(writable);

    writable.on("finish", () => {
      expect(writable.getContents().length < pngBuffer.length).toBeTruthy();
      done();
    });
  });

  it("should compress jpg file", (done) => {
    const readable = createReadableFrom(jpegBuffer);
    const writable = new WritableStreamBuffer();
    const compressor = service.createCompressor("image/jpeg");

    readable.pipe(compressor).pipe(writable);

    writable.on("finish", () => {
      expect(writable.getContents().length < jpegBuffer.length).toBeTruthy();
      done();
    });
  });

  it("should upload and don't compress", async (done) => {
    const image = createReadableFrom(pngBuffer);
    const { bucketFile } = await service.uploadStream("test", image, {
      filename: "avatar.png",
      public: true,
      compress: false,
      acceptMIME: ["image/jpeg", "image/png"],
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
      compress: true,
      acceptMIME: ["image/jpeg", "image/png"],
    });

    (bucketFile as any).writable.on("finish", () => {
      expect(
        (bucketFile as any).contents.length < pngBuffer.length,
      ).toBeTruthy();
      done();
    });
  });
});
