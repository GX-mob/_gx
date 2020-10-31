/**
 * Quick & Dirty Google Cloud Storage emulator for tests.
 * from @https://gist.github.com/nfarina/90ba99a5187113900c86289e67586aaa
 */
import { Readable, PassThrough } from "stream";

export default class MockStorage {
  buckets: { [name: string]: MockBucket };

  constructor() {
    this.buckets = {};
  }

  bucket(name: string) {
    return this.buckets[name] || (this.buckets[name] = new MockBucket(name));
  }
}

export class MockBucket {
  name: string;
  files: { [path: string]: MockFile };

  constructor(name: string) {
    this.name = name;
    this.files = {};
  }

  file(path: string) {
    return this.files[path] || (this.files[path] = new MockFile(path));
  }
}

export class MockFile {
  path: string;
  contents = Buffer.alloc(0);
  metadata: any;
  writable!: PassThrough;

  constructor(path: string) {
    this.path = path;
    this.contents = new Buffer(0);
    this.metadata = {};
  }

  get() {
    return [this, this.metadata];
  }

  setMetadata(metadata: any) {
    const customMetadata = { ...this.metadata.metadata, ...metadata.metadata };
    this.metadata = { ...this.metadata, ...metadata, metadata: customMetadata };
  }

  createReadStream() {
    const readable = new Readable();
    readable.push(this.contents);
    return readable;
  }

  createWriteStream({ metadata }: any) {
    this.setMetadata(metadata);
    this.writable = new PassThrough();
    this.writable.on("data", (chunk: any) => {
      this.contents = Buffer.concat([this.contents, chunk]);
    });
    return this.writable;
  }

  delete() {
    return Promise.resolve();
  }
}
