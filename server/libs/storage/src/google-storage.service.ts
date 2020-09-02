import { Injectable } from "@nestjs/common";
import { Storage } from "@google-cloud/storage";

@Injectable()
export class GoogleStorageService {
  public readonly client: Storage;
  constructor() {
    this.client = new Storage();
  }
}
