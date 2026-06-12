import { Request } from 'express';
import { UserRole } from '../../users/users.schema';

export type JwtUser = {
  sub: string;
  email: string;
  role: UserRole;
};

export type RequestWithUser = Request & {
  user: JwtUser;
};
