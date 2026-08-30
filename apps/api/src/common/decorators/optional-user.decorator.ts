import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/auth-user';

export const OptionalUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return request.user;
});
