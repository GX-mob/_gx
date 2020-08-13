/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Service } from "fastify-decorators";
import { Storage, Bucket, File } from "@google-cloud/storage";
import { Readable, Writable, Duplex } from "stream";
import PngQuant from "pngquant";
import JpegTran from "jpegtran";
import { PassThrough } from "stream";
import FileType from "file-type";

export type AbstractionBucket = {
  bucket: Bucket;
  publicUrl: string;
  getPublicUrl(filename: string): string;
  upload(
    readableStream: Readable,
    options: UploadStreamOptions
  ): Promise<{
    bucketFile: File;
    storageWritableStream: Writable;
    publicUrl: string;
  }>;
};

type UploadStreamOptions = {
  filename: string;
  public: boolean;
  compress?: boolean;
  acceptMIME: string[];
  errorHandler?(error: Error): void;
};

type CompressibleMIME = "image/png" | "image/jpg" | "image/jpeg";

@Service()
export class StorageService {
  private client: Storage;
  private compressibleMIME = ["image/png", "image/jpg", "image/jpeg"];
  buckets: { [name: string]: AbstractionBucket } = {};
  constructor() {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === "production") {
      this.client = new Storage();
      return;
    }

    const StorageMock = require("./mock/gcp-storage").default; //eslint-disable-line
    this.client = new StorageMock();
  }

  /**
   * @param bucket_name
   * @param prefix_url Used to make the public url of an item
   * @default "https://storage.googleapis.com/"
   */
  bucket(
    name: string,
    prefix_url = "https://storage.googleapis.com/"
  ): AbstractionBucket {
    if (name in this.buckets) {
      throw new Error(
        `Trying to configure a bucket already configured: ${name}`
      );
    }

    this.buckets[name] = {
      bucket: this.client.bucket(name),
      publicUrl: prefix_url,
      getPublicUrl: (filename: string) => `${prefix_url}/${name}/${filename}`,
      upload: (readableStream, options) =>
        this.uploadStream(name, readableStream, options),
    };

    return this.buckets[name];
  }

  /**
   * @param bucket_name
   * @param readable Readable stream
   * @param {UploadStreamOptions} options
   */
  async uploadStream(
    bucket_name: string,
    readable: Readable,
    options: UploadStreamOptions
  ) {
    const { bucket, getPublicUrl } = this.buckets[bucket_name];
    const { filename, compress, errorHandler, acceptMIME } = options;

    if (errorHandler) {
      readable.on("error", errorHandler);
    }

    const [saveReadable, mimeDetectReadable] = this.cloneReadable(readable);
    const mime = await this.getMIME(mimeDetectReadable);

    this.checkValidMime(mime, acceptMIME);

    const bucketFile = bucket.file(filename);
    const storageWritableStream = bucketFile.createWriteStream({
      metadata: {
        contentType: mime,
      },
      public: options.public,
      gzip: true,
      resumable: false,
    });

    if (errorHandler) {
      storageWritableStream.on("error", errorHandler);
    }

    const response = {
      bucketFile,
      storageWritableStream,
      publicUrl: getPublicUrl(filename),
    };

    if (!compress) {
      saveReadable.pipe(storageWritableStream);
      return response;
    }

    switch (mime) {
      case "image/png":
      case "image/jpeg":
        const compressor = this.createCompressor(mime);
        const compressing = saveReadable.pipe(compressor);

        saveReadable.on("error", (err) => compressing.destroy(err));
        compressing.pipe(storageWritableStream);
        break;
    }

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
        `MIME type not acceptable, provided: ${mime}, accepts: ${mimes}`
      );
    }
  }

  createCompressor(mime: CompressibleMIME): Duplex {
    if (mime === "image/jpeg") {
      return new JpegTran();
    }

    return new PngQuant([192, "--quality", "75-85", "--nofs", "-"]);
  }
}
