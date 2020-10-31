/**
 * Storage Service
 *
 * @group unit/services/storage
 */
import { Test, TestingModule } from "@nestjs/testing";
import { readFileSync, createReadStream } from "fs";
import { join } from "path";
import { StorageService } from "./storage.service";
import { GoogleStorageService } from "./google-storage.service";
import StorageMock from "./mock/gcp-storage.mock";
import { Readable } from "stream";

describe("StorageService", () => {
  let service: StorageService;

  const pngPath = join(__dirname, "mock", "mock.png");
  const pngBuffer = readFileSync(join(__dirname, "mock", "mock.png"));

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

  it("should handle stream error", async (done) => {
    const stream = createReadStream(pngPath);
    const errorMessage = "error";

    setTimeout(() => stream.destroy(new Error(errorMessage)), 100);

    service.uploadStream("test", stream, {
      filename: "avatar.png",
      public: true,
      acceptMIME: ["image/jpeg", "image/png"],
      streamErrorHandler: (error) => {
        expect(error).toStrictEqual(new Error(errorMessage));
      },
    });

    setTimeout(() => done(), 300);
  });

  it("should throw error due to cannot detect the MIME type of stream", async () => {
    const readable = new Readable();

    new Array(1000).map((i) => readable.push(i));
    readable.push(null);

    try {
      await service.uploadStream("test", readable, {
        filename: "avatar.jpg",
        public: true,
        acceptMIME: ["image/png", "image/jpeg"],
        streamErrorHandler(error) {},
      });
    } catch (e) {
      expect(e.message).toBe("Cannot detect the MIME type");
    }
  });

  it("should throw error due to non-acceptable mime type", async () => {
    try {
      const stream = createReadStream(pngPath);
      await service.uploadStream("test", stream, {
        filename: "avatar.png",
        public: true,
        acceptMIME: ["image/jpeg"],
        streamErrorHandler(error) {},
      });
    } catch (e) {
      expect(e.message).toBe(
        "MIME type not acceptable, provided: image/png, accepts: image/jpeg",
      );
    }
  });

  it("should upload", async (done) => {
    const stream = createReadStream(pngPath);
    const { bucketFile } = await service.uploadStream("test", stream, {
      filename: "avatar.png",
      public: true,
      acceptMIME: ["image/jpeg", "image/png"],
      streamErrorHandler(error) {},
    });

    (bucketFile as any).writable.on("finish", () => {
      expect(
        (bucketFile as any).contents.length === pngBuffer.length,
      ).toBeTruthy();
      done();
    });
  });
});
