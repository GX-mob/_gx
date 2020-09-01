import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { GoogleStorageService } from "./google-storage.service";

@Module({
  providers: [GoogleStorageService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
