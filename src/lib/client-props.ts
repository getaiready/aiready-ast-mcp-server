import type { Team, TeamMember } from '@/lib/db';

export interface ClientProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    githubId?: string | null;
    googleId?: string | null;
    scanConfig?: any;
  } | null;
  teams?: (TeamMember & { team: Team })[];
  overallScore?: number | null;
}
