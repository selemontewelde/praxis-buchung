import { Reflector } from '@nestjs/core';

export type Role = 'ADMIN' | 'THERAPIST';

/**
 * Marks a controller or handler with the roles allowed to reach it. Enforced by
 * RolesGuard (which must run after SessionAuthGuard). No marker = any
 * authenticated user.
 */
export const Roles = Reflector.createDecorator<Role[]>();
