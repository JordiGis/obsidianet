import { useState, useEffect } from "react";
import { Table, Text, Group, Button, Anchor } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { IconRefresh, IconExternalLink } from "@tabler/icons-react";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";
import { getAdminPages } from "@/ee/admin/services/admin-service";

type Page = {
  id: string;
  title: string;
  icon: string | null;
  slugId: string;
  updatedAt: string;
  createdAt: string;
  spaceName: string | null;
  creatorName: string | null;
};

function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

export default function AdminDocuments() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminPages();
      setPages(data as unknown as Page[]);
    } catch (err) {
      console.error("Failed to load pages", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Documents - {getAppName()}</title>
      </Helmet>
      <SettingsTitle title="Documents" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
        <Button size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {loading && pages.length === 0 ? (
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Space</Table.Th>
              <Table.Th>Author</Table.Th>
              <Table.Th>Updated</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pages.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    No documents yet
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {pages.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td fw={500}>
                  <Anchor
                    href={`/s/${p.slugId || ""}`}
                    target="_blank"
                    size="sm"
                  >
                    <Group gap={4}>
                      <span>{p.icon || "📄"}</span>
                      <span>{p.title || "Untitled"}</span>
                      <IconExternalLink size={12} />
                    </Group>
                  </Anchor>
                </Table.Td>
                <Table.Td>{p.spaceName || "—"}</Table.Td>
                <Table.Td>{p.creatorName || "—"}</Table.Td>
                <Table.Td>{ago(p.updatedAt)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
