import { Readable } from "stream";
import { FastifyRequest, FastifyReply } from "fastify";
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
import { ISession, IUser } from "@shared/interfaces";
import { SessionRepository } from "@app/repositories";
import { AuthGuard, User, Session } from "@app/auth";
import { StorageService } from "@app/storage";
import { logger, util } from "@app/helpers";
import { UpdateProfileDto } from "./management.dto";
import { UserEntity } from "./entities/user.entity";
import { STORAGE_BUCKETS, STORAGE_PREFIX_URLS } from "../../constants";
import { Logger } from "pino";
import { UsersService } from "../users.service";

@Controller("account/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  logger: Logger = logger;
  constructor(
    private usersService: UsersService,
    readonly sessionRepository: SessionRepository,
    readonly storage: StorageService,
  ) {}

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  getHandler(@User() user: IUser): IUser {
    return new UserEntity(user);
  }

  @Patch()
  async updateHandler(
    @User() user: IUser,
    @Session() session: ISession,
    @Body() body: UpdateProfileDto,
  ) {
    await this.usersService.updateById(user._id, body);
    await this.sessionRepository.updateCache({ _id: session._id });
  }

  @Patch("avatar")
  async uploadAvatar(
    @User() user: IUser,
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
  ) {
    if (!request.isMultipart()) {
      throw new NotAcceptableException();
    }

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
        util.retryUnderHood(() =>
          this.storage.delete(
            STORAGE_BUCKETS.USERS_AVATARTS,
            user.avatar as string,
          ),
        );
      }

      util.retryUnderHood(() =>
        this.usersService.updateById(user._id, { avatar: url }),
      );

      // TODO: Emit Pub/Sub event that fires a function to compress and generate usual sizes.
      // pseudo: pubSubClient.emit("avatarUploaded", { filename: url.split("/").pop() as string; })

      reply.send({ url });
    });
  }
}
