import { Global, Module } from "@nestjs/common";
import { CacheModule } from "@app/cache";
import { RepositoryService } from "./repository.service";
import {
  UserRepository,
  RideRepository,
  SessionRepository,
  PendencieRepository,
} from "./repositories";

@Global()
@Module({
  imports: [CacheModule],
  providers: [
    RepositoryService,
    UserRepository,
    RideRepository,
    SessionRepository,
    PendencieRepository,
  ],
  exports: [
    RepositoryService,
    UserRepository,
    RideRepository,
    SessionRepository,
    PendencieRepository,
  ],
})
export class RepositoryModule {}
