import { Injectable } from "@nestjs/common";
import { Storage, Bucket, File } from "@google-cloud/storage";
import { Readable, Writable } from "stream";
import { PassThrough } from "stream";
import FileType from "file-type";
import { GoogleStorageService } from "./google-storage.service";

export type AbstractionBucket = {
  bucket: Bucket;
  publicUrl: string;
  getPublicUrl(filename: string): string;
  upload(
    readableStream: Readable,
    options: UploadStreamOptions,
  ): Promise<{
    bucketFile: File;
    storageWritableStream: Writable;
    publicUrl: string;
  }>;
};

export type UploadStreamOptions = {
  filename: string;
  public: boolean;
  acceptMIME: string[];
  /**
   * To catch internal stream errors.
   * @param {Error} error
   */
  streamErrorHandler(error: Error): void;
};

@Injectable()
export class StorageService {
  private readonly client: Storage;
  readonly buckets: { [name: string]: AbstractionBucket } = {};
  constructor(private readonly googleStorageService: GoogleStorageService) {
    this.client = googleStorageService.client;
  }

  /**
   * @param bucket_name
   * @param readable Readable stream
   * @param {UploadStreamOptions} options
   */
  async uploadStream(
    bucket_name: string,
    readable: Readable,
    options: UploadStreamOptions,
  ) {
    const bucket = this.client.bucket(bucket_name);
    const { filename, streamErrorHandler, acceptMIME } = options;

    readable.on("error", streamErrorHandler);

    const [saveReadable, mimeDetectReadable] = this.cloneReadable(readable);

    const mime = await this.getMIME(mimeDetectReadable);

    this.checkValidMime(mime, acceptMIME);

    const bucketFile = bucket.file(filename);
    const storageWritableStream = bucketFile.createWriteStream({
      metadata: {
        contentType: mime,
      },
      public: typeof options.public === "undefined" ? true : options.public,
      gzip: true,
      resumable: false,
    });

    storageWritableStream.on("error", streamErrorHandler);

    const response = {
      bucketFile,
      storageWritableStream,
    };

    saveReadable.pipe(storageWritableStream);
    return response;
  }

  async getMIME(readable: Readable): Promise<string> {
    const type = await FileType.fromStream(readable);

    if (!type) {
      throw new Error("Cannot detect the MIME type");
    }

    return type.mime;
  }

  cloneReadable(readable: Readable): Readable[] {
    const clone1 = new PassThrough();
    const clone2 = new PassThrough();

    readable.on("error", (err: Error) => {
      clone1.destroy(err);
      clone2.destroy(err);
    });

    readable.pipe(clone1);
    readable.pipe(clone2);

    return [clone1, clone2];
  }

  checkValidMime(mime: string, mimes: string[]) {
    if (mimes.indexOf(mime) === -1) {
      throw new Error(
        `MIME type not acceptable, provided: ${mime}, accepts: ${mimes}`,
      );
    }
  }

  /**
   * Remove an item from storage
   * @param bucket
   * @param url
   */
  delete(bucket: string, url: string) {
    const fileName = url.split("/").pop() as string;
    return this.client.bucket(bucket).file(fileName).delete();
  }
}
