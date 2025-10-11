export type AdminDashboardResponse = {
  metrics: Metrics;
  recentUsers: UserSummary[];
  recentWorkspaces: WorkspaceSummary[];
};

export type Metrics = {
  totalUsers: number;
  activeUsers: number;
  pendingProfiles: number;
  adminUsers: number;
  totalWorkspaces: number;
  automationEnabled: number;
  digestEnabled: number;
  averageTeamSize: number;
};

export type UserSummary = {
  id: number;
  email: string;
  name: string;
  nickname: string;
  profileCompleted: boolean;
  role: string;
  joinedAt: string;
  workspaceName: string | null;
  workspaceSlug: string | null;
};

export type WorkspaceSummary = {
  id: number;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  automationEnabled: boolean;
  digestEnabled: boolean;
  createdAt: string;
};
