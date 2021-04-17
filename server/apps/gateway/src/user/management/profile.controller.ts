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
import { Account, IAccount } from "@core/domain/account";
import { AuthGuard, DUser } from "@app/auth";
import { StorageService } from "@app/storage";
import { util } from "@app/helpers";
import { PinoLogger } from "nestjs-pino";
import { UserDto, UpdateProfileDto } from "../user.dto";
import { STORAGE_BUCKETS, STORAGE_PREFIX_URLS } from "../../constants";
import { UserService } from "../user.service";

@Controller("user/profile")
@UseGuards(AuthGuard)
export class UserProfileController {
  constructor(
    private usersService: UserService,
    private storage: StorageService,
    private logger: PinoLogger,
  ) {
    logger.setContext(UserProfileController.name);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  getProfileHandler(@DUser() user: Account): IAccount {
    return new UserDto(user.getData());
  }

  @Patch()
  async updateHandler(
    @DUser() user: Account,
    @Body() body: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(user, body);
  }

  @Patch("avatar")
  async uploadAvatar(
    @DUser() user: Account,
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
      const fileName = `${user.getID()}.${Date.now()}.${fileExtension}`;
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
            streamErrorHandler: (err) => {
              this.logger.error(err);
            },
          },
        );
      } catch (err) {
        error = err;
      }
    };

    await new Promise<void>((resolve, reject) => {
      request.multipart(handler, () => {
        if (error) {
          this.logger.error(error);
          return reject(new InternalServerErrorException());
        }

        const userCurrentAvatar = user.getData().avatar;

        if (userCurrentAvatar) {
          util.retryUnderHood(() =>
            this.storage.delete(
              STORAGE_BUCKETS.USERS_AVATARTS,
              userCurrentAvatar,
            ),
          );
        }

        util.retryUnderHood(() =>
          this.usersService.updateAvatar(user, url),
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
