import React, { useState, useEffect } from "react";
import { Text, Paper, Group, SimpleGrid, Stack, Alert } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import {
  IconUsers,
  IconFileText,
  IconFiles,
  IconDatabase,
  IconAlertCircle,
} from "@tabler/icons-react";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";
import { getAdminStats, getAdminChartData } from "@/ee/admin/services/admin-service";
import {
  UsersAreaChart,
  PagesBySpaceChart,
  StoragePieChart,
} from "@/ee/admin/components/admin-charts";

/**
 * ErrorBoundary to catch render errors in admin dashboard
 */
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <>
          <SettingsTitle title="Admin Dashboard" />
          <Alert icon={<IconAlertCircle size={16} />} title="Render Error" color="red">
            <Text size="sm">{this.state.error?.message || "Unknown error"}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Check the browser console for details.
            </Text>
          </Alert>
        </>
      );
    }
    return this.props.children;
  }
}

function bytes(n: number): string {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

interface Stats {
  users: number;
  deactivated: number;
  pages: number;
  spaces: number;
  files: number;
  fileBytes: number;
}

interface ChartData {
  usersByMonth: { month: string; count: number }[];
  storageByType: { kind: string; bytes: number; count: number }[];
  pagesBySpace: { space: string; count: number }[];
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group gap="xs" mb={4}>
        <Icon size={16} stroke={1.5} color="gray" />
        <Text size="xs" c="dimmed">
          {label}
        </Text>
      </Group>
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      )}
    </Paper>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, chartsData] = await Promise.all([
          getAdminStats(),
          getAdminChartData(),
        ]);
        setStats(statsData as unknown as Stats);
        setCharts(chartsData as unknown as ChartData);
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err);
        console.error("Failed to load admin stats", err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardErrorBoundary>
      <Helmet>
        <title>Admin Dashboard - {getAppName()}</title>
      </Helmet>
      <SettingsTitle title="Admin Dashboard" />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="API Error" color="yellow" mb="md">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {loading ? (
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      ) : stats ? (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm" mb="md">
            <StatTile
              icon={IconUsers}
              label="Users"
              value={stats.users}
              sub={
                stats.deactivated
                  ? `${stats.deactivated} deactivated`
                  : "active"
              }
            />
            <StatTile
              icon={IconFileText}
              label="Documents"
              value={stats.pages}
              sub={`${stats.spaces} spaces`}
            />
            <StatTile
              icon={IconFiles}
              label="Files"
              value={stats.files}
            />
            <StatTile
              icon={IconDatabase}
              label="Storage"
              value={bytes(stats.fileBytes)}
              sub="database usage"
            />
          </SimpleGrid>

          {charts && (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={500} mb="sm">
                  Users per month
                </Text>
                <UsersAreaChart data={charts.usersByMonth} />
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={500} mb="sm">
                  Storage by type
                </Text>
                <StoragePieChart data={charts.storageByType} />
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={500} mb="sm">
                  Pages by space
                </Text>
                <PagesBySpaceChart data={charts.pagesBySpace} />
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={500} mb="sm">
                  Storage details
                </Text>
                <Stack gap="xs" mt="sm">
                  <Row k="File size in database" v={bytes(stats.fileBytes)} />
                  <Row k="File count" v={String(stats.files)} />
                  <Row k="Total pages" v={String(stats.pages)} />
                  <Row k="Total spaces" v={String(stats.spaces)} />
                  <Row k="Total users" v={String(stats.users)} />
                </Stack>
              </Paper>
            </SimpleGrid>
          )}
        </>
      ) : (
        <Text c="dimmed" size="sm">
          Could not load stats. Make sure you have admin permissions.
        </Text>
      )}
    </DashboardErrorBoundary>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <Group justify="space-between" py={6} style={{ borderBottom: "1px solid #f0f0f0" }}>
      <Text size="sm" c="dimmed">
        {k}
      </Text>
      <Text size="sm" fw={500}>
        {v}
      </Text>
    </Group>
  );
}
