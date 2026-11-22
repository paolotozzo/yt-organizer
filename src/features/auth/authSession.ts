import type { ScopeCoverage } from './scopeCoverage';

export type AuthenticatedUser = {
  id: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
};

export type AuthSession = {
  user: AuthenticatedUser;
  scopeCoverage: ScopeCoverage;
};
