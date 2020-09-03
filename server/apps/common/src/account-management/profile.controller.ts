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
  SerializeOptions,
  ClassSerializerInterceptor,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { DataService } from "@app/data";
import { AuthGuard, AuthorizedRequest } from "@app/auth";
import { StorageService } from "@app/storage";
import { logger, util } from "@app/helpers";
import { UpdateProfileDto } from "./dto";
import { UserEntity } from "./entities/user.entity";

@Controller("account/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(readonly data: DataService, readonly storage: StorageService) {}

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  async getHandler(@Request() req: AuthorizedRequest) {
    return new UserEntity(req.session.user);
  }

  @Patch()
  async updateHandler(
    @Request() req: AuthorizedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    const { session } = req;

    await this.data.users.update({ _id: session.user._id }, body);
    await this.data.sessions.updateCache({ _id: session._id });
  }

  @Patch("avatar")
  async uploadAvatar(
    @Request() request: AuthorizedRequest,
    @Response() reply: FastifyReply,
  ) {
    if (!request.isMultipart()) {
      throw new BadRequestException("must-be-multipart");
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

      try {
        const fileExtension = filename.split(".").pop() as string;
        const fileName = `${user._id}.${Date.now()}.${fileExtension}`;

        url = (
          await this.storage.uploadStream("gx-mob-avatars", readalbe, {
            filename: fileName,
            public: true,
            compress: true,
            acceptMIME: ["image/jpeg", "image/png"],
            errorHandler: (err) => {
              error = err;
            },
          })
        ).publicUrl;
      } catch (err) {
        error = err;
      }
    };

    request.multipart(handler, () => {
      if (error) {
        logger.error(error);
        reply.send(new InternalServerErrorException());
      }

      if (user.avatar) {
        const remove = this.storage.delete("gx-mob-avatars", user.avatar);
        util.handleRejectionByUnderHood(remove);
      }

      reply.send({ url });
    });
  }
}
