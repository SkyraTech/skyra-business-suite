export interface User {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface AuthSessionResponse {
  user: User;
  csrfToken: string;
  sessionToken?: string;
}

export interface MeResponse {
  user: User;
  organizations: Organization[];
}
