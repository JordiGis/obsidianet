import { useState, useEffect } from "react";
import { Table, Text, Group, Button, Badge } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { IconRefresh, IconDatabase } from "@tabler/icons-react";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";
import api from "@/lib/api-client";

interface UserStorage {
  userId: string;
  name: string;
  email: string;
  fileCount: number;
  totalBytes: number;
}

function bytes(n: number): string {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

async function getStorageByUser() {
  const res = await api.post("/admin/storage-by-user");
  return res.data;
}

export default function WorkspaceStorage() {
  const [rows, setRows] = useState<UserStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getStorageByUser();
      setRows(data as UserStorage[]);
    } catch (err: any) {
      console.error("Failed to load storage data", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalBytes = rows.reduce((a, r) => a + Number(r.totalBytes || 0), 0);
  const totalFiles = rows.reduce((a, r) => a + Number(r.fileCount || 0), 0);

  return (
    <>
      <Helmet>
        <title>Storage - {getAppName()}</title>
      </Helmet>
      <SettingsTitle title="Storage by user" />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Button size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      ) : error ? (
        <Text c="red" size="sm">
          {error}
        </Text>
      ) : (
        <>
          <Group gap="lg" mb="md">
            <div>
              <Text size="xs" c="dimmed">
                Total storage
              </Text>
              <Text fw={700} size="lg">
                {bytes(totalBytes)}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">
                Total files
              </Text>
              <Text fw={700} size="lg">
                {totalFiles}
              </Text>
            </div>
          </Group>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Files</Table.Th>
                <Table.Th>Storage used</Table.Th>
                <Table.Th>% of total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      No files uploaded yet
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {rows.map((r) => (
                <Table.Tr key={r.userId}>
                  <Table.Td fw={500}>
                    <Group gap={6}>
                      <IconDatabase size={14} stroke={1.5} color="gray" />
                      <span>{r.name || r.email}</span>
                    </Group>
                  </Table.Td>
                  <Table.Td>{r.fileCount}</Table.Td>
                  <Table.Td>{bytes(Number(r.totalBytes))}</Table.Td>
                  <Table.Td>
                    {totalBytes > 0
                      ? `${((Number(r.totalBytes) / totalBytes) * 100).toFixed(1)}%`
                      : "—"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </>
  );
}
