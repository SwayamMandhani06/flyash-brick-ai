import React from 'react';
import { AppShell } from '../components/layout/AppShell';

interface WorkstationLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'teal' | 'amber' | 'subtle';
  actions?: React.ReactNode;
}

export const WorkstationLayout: React.FC<WorkstationLayoutProps> = (props) => {
  return <AppShell {...props} />;
};

export default WorkstationLayout;
