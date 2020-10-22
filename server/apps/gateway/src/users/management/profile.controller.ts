import { Readable } from "stream";
import { FastifyRequest } from "fastify";
import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  NotAcceptableException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ISession, IUser } from "@shared/interfaces";
import { AuthGuard, User, Session } from "@app/auth";
import { StorageService } from "@app/storage";
import { util } from "@app/helpers";
import { PinoLogger } from "nestjs-pino";
import { UserDto, UpdateProfileDto } from "./management.dto";
import { STORAGE_BUCKETS, STORAGE_PREFIX_URLS } from "../../constants";
import { UsersService } from "../users.service";

@Controller("account/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private usersService: UsersService,
    private storage: StorageService,
    private logger: PinoLogger,
  ) {
    logger.setContext(ProfileController.name);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  getProfileHandler(@User() user: IUser): IUser {
    return new UserDto(user);
  }

  @Patch()
  async updateHandler(
    @Session() session: ISession,
    @Body() body: UpdateProfileDto,
  ) {
    await this.usersService.updateById(session.user._id, body);
  }

  @Patch("avatar")
  async uploadAvatar(
    @User() user: IUser,
    @Request() request: FastifyRequest,
  ): Promise<{ url: string }> {
    if (!request.isMultipart()) {
      throw new NotAcceptableException();
    }

    let handling = false;
    let error: Error | null = null;
    let url = "";

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

    await new Promise((resolve, reject) => {
      request.multipart(handler, () => {
        if (error) {
          this.logger.error(error);
          return reject(new InternalServerErrorException());
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

        resolve();
      });
    });

    if (error) throw error;

    return { url };
  }
}
