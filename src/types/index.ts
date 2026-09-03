// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER  = 'USER',
}

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roleName: Role;
  isAccountVerified: boolean;
  isActive?: boolean;
  lockReason?: string;
  createdAt?: string;
}
