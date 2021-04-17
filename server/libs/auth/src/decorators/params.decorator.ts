import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Account } from "@core/domain/account"

export const DUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return new Account(request.session.user);
  },
);

export const DSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);
