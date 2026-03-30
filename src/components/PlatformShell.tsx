'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  PlatformShell as SharedPlatformShell,
  NavItem,
} from '@aiready/components';
import Link from 'next/link';
import { Team, TeamMember } from '@/lib/db';
import {
  RocketIcon,
  SettingsIcon,
  TrendingUpIcon,
  RobotIcon,
  ChartIcon,
} from './Icons';
import { Mail } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  teams?: (TeamMember & { team: Team })[];
  overallScore?: number | null;
  activePage?: 'dashboard' | 'settings' | 'repo' | 'metrics';
}

export default function PlatformShell({
  children,
  user,
  teams = [],
  overallScore,
  activePage = 'dashboard',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Platform', icon: RocketIcon },
    { href: '/strategy', label: 'Scan Strategy', icon: SettingsIcon },
    { href: '/trends', label: 'Trends Explorer', icon: TrendingUpIcon },
    { href: '/map', label: 'Codebase Map', icon: RobotIcon },
    { href: '/metrics', label: 'Methodology', icon: ChartIcon },
    { href: '/contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <SharedPlatformShell
      user={user}
      teams={teams}
      overallScore={overallScore}
      activePage={activePage}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      onSignOut={() => signOut({ callbackUrl: '/' })}
      LinkComponent={Link}
      navItems={navItems}
    >
      {children}
    </SharedPlatformShell>
  );
}
