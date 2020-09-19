import { Readable } from "stream";
import { FastifyReply } from "fastify";
import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Response,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  NotAcceptableException,
  InternalServerErrorException,
} from "@nestjs/common";
import { UserInterface } from "@shared/interfaces";
import { UserRepository, SessionRepository } from "@app/repositories";
import { AuthGuard, AuthorizedRequest } from "@app/auth";
import { StorageService } from "@app/storage";
import { logger, util } from "@app/helpers";
import { UpdateProfileDto } from "./dto";
import { UserEntity } from "./entities/user.entity";
import { STORAGE_BUCKETS, STORAGE_PREFIX_URLS } from "../constants";
import { Logger } from "pino";

@Controller("account/profile")
@UseGuards(AuthGuard)
export class AccountProfileController {
  logger: Logger = logger;
  constructor(
    readonly userRepository: UserRepository,
    readonly sessionRepository: SessionRepository,
    readonly storage: StorageService,
  ) {}

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  getHandler(@Request() req: AuthorizedRequest): UserInterface {
    return new UserEntity(req.session.user);
  }

  @Patch()
  async updateHandler(
    @Request() req: AuthorizedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    const { session } = req;

    await this.userRepository.update({ _id: session.user._id }, body);
    await this.sessionRepository.updateCache({ _id: session._id });
  }

  @Patch("avatar")
  async uploadAvatar(
    @Request() request: AuthorizedRequest,
    @Response() reply: FastifyReply,
  ) {
    if (!request.isMultipart()) {
      throw new NotAcceptableException();
    }

    const { user } = request.session;

    let handling = false;
    let error: Error;
    let url: string;

    const handler = async (
      _field: string,
      readalbe: Readable,
      filename: string,
    ) => {
      if (handling) return;
      handling = true;

      const fileExtension = filename.split(".").pop() as string;
      const fileName = `${user._id}.${Date.now()}.${fileExtension}`;
      url = `${STORAGE_PREFIX_URLS.USERS_AVATARTS}/${STORAGE_BUCKETS.USERS_AVATARTS}/${fileName}`;

      try {
        await this.storage.uploadStream(
          STORAGE_BUCKETS.USERS_AVATARTS,
          readalbe,
          {
            filename: fileName,
            public: true,
            compress: true,
            acceptMIME: ["image/jpeg", "image/png"],
            // Due to upload works under the hood, this is for log purpose only,
            // don't letting user wait any internal stream error alert.
            errorHandler: (err) => {
              this.logger.error(err);
            },
          },
        );
      } catch (err) {
        error = err;
      }
    };

    request.multipart(handler, () => {
      if (error) {
        this.logger.error(error);
        reply.send(new InternalServerErrorException());
        return;
      }

      if (user.avatar) {
        const remove = this.storage.delete(
          STORAGE_BUCKETS.USERS_AVATARTS,
          user.avatar,
        );
        util.handleRejectionByUnderHood(remove);
      }

      reply.send({ url });
    });
  }
}
