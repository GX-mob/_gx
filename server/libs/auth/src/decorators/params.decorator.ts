import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@core/domain/user"

export const DUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return new User(request.session.user);
  },
);

export const DSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);
