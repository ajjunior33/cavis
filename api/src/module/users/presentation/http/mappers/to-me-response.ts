import type { SafeUser } from '../../../../../shared/database/drizzle/schema/users';

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: SafeUser['role'];
  created_at: Date;
  is_demo: boolean;
};

export function toMeResponse(user: SafeUser): MeResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt,
    is_demo: user.isDemo,
  };
}
