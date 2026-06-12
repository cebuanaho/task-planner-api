import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../users/users.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
