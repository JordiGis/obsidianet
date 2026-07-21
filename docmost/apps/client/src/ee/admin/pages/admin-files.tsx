import { useState, useEffect } from "react";
import {
  Table,
  Text,
  Group,
  Button,
  Image,
  SimpleGrid,
  Anchor,
} from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { IconRefresh } from "@tabler/icons-react";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";
import { getAdminFiles } from "@/ee/admin/services/admin-service";

type File = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: string;
  createdAt: string;
  spaceName: string | null;
  creatorName: string | null;
  pageId: string | null;
};

function bytes(n: number): string {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

export default function AdminFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminFiles();
      setFiles(data as unknown as File[]);
    } catch (err) {
      console.error("Failed to load files", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalBytes = files.reduce((a, f) => a + Number(f.fileSize || 0), 0);
  const images = files.filter((f) => (f.mimeType || "").startsWith("image/"));

  return (
    <>
      <Helmet>
        <title>Admin Files - {getAppName()}</title>
      </Helmet>
      <SettingsTitle title="Files" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
        <Button size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {loading && files.length === 0 ? (
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      ) : (
        <>
          {images.length > 0 && (
            <>
              <Text size="sm" fw={500} mb="xs">
                Images
              </Text>
              <SimpleGrid
                cols={{ base: 3, sm: 4, md: 6 }}
                spacing="sm"
                mb="lg"
              >
                {images.map((f) => (
                  <Anchor
                    key={f.id}
                    href={`/api/admin/files/${f.id}`}
                    target="_blank"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        border: "1px solid #e9e8e4",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={`/api/admin/files/${f.id}`}
                        alt={f.fileName}
                        h={96}
                        fit="cover"
                        loading="lazy"
                      />
                      <div style={{ padding: "4px 8px" }}>
                        <Text size="xs" truncate>
                          {f.fileName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {bytes(Number(f.fileSize))}
                        </Text>
                      </div>
                    </div>
                  </Anchor>
                ))}
              </SimpleGrid>
            </>
          )}

          <Text size="sm" fw={500} mb="xs">
            All files
          </Text>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Space</Table.Th>
                <Table.Th>Uploaded by</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      No files yet
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {files.map((f) => (
                <Table.Tr key={f.id}>
                  <Table.Td fw={500}>
                    <Anchor
                      href={`/api/admin/files/${f.id}`}
                      target="_blank"
                      size="sm"
                    >
                      {f.fileName}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{f.mimeType || f.type || "—"}</Table.Td>
                  <Table.Td>{bytes(Number(f.fileSize))}</Table.Td>
                  <Table.Td>{f.spaceName || "—"}</Table.Td>
                  <Table.Td>{f.creatorName || "—"}</Table.Td>
                  <Table.Td>{ago(f.createdAt)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </>
  );
}
