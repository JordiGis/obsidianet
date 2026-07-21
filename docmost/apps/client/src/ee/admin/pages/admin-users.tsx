import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  TextInput,
  NativeSelect,
  Table,
  Badge,
  Group,
  ActionIcon,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Helmet } from "react-helmet-async";
import { IconRefresh } from "@tabler/icons-react";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";
import {
  getAdminUsers,
  createAdminUser,
  toggleUserActive,
  deleteAdminUser,
} from "@/ee/admin/services/admin-service";

type U = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
};

function ago(d: string | null) {
  if (!d) return "—";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

const roleColors: Record<string, string> = {
  owner: "purple",
  admin: "blue",
  member: "gray",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data as unknown as U[]);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Users - {getAppName()}</title>
      </Helmet>
      <SettingsTitle title="Users" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
        <Button size="sm" onClick={loadUsers} loading={loading}>
          Refresh
        </Button>
        <Button size="sm" onClick={open}>
          + Create user
        </Button>
      </div>

      {loading && users.length === 0 ? (
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Last login</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    No users found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td fw={500}>{u.name || "—"}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>
                  <Badge color={roleColors[u.role] || "gray"} variant="light">
                    {u.role}
                  </Badge>
                </Table.Td>
                <Table.Td>{ago(u.lastLoginAt)}</Table.Td>
                <Table.Td>
                  {u.deactivatedAt ? (
                    <Badge color="red" variant="light">
                      Deactivated
                    </Badge>
                  ) : (
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      color={u.deactivatedAt ? "green" : "yellow"}
                      onClick={async () => {
                        try {
                          await toggleUserActive(u.id, !!u.deactivatedAt);
                          loadUsers();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      {u.deactivatedAt ? "Activate" : "Deactivate"}
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={async () => {
                        if (!confirm(`Delete ${u.email}? This cannot be undone.`))
                          return;
                        try {
                          await deleteAdminUser(u.id);
                          loadUsers();
                        } catch (err: any) {
                          alert(err?.response?.data?.error || "Error deleting user");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <CreateUserModal
        opened={opened}
        onClose={close}
        onDone={() => {
          close();
          loadUsers();
        }}
      />
    </>
  );
}

function CreateUserModal({
  opened,
  onClose,
  onDone,
}: {
  opened: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const p = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => chars[b % chars.length])
      .join("");
    setPassword(p);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createAdminUser({ name, email, password, role });
      onDone();
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Create user" centered>
      <form onSubmit={submit}>
        <TextInput
          label="Name"
          placeholder="Optional"
          value={name}
          onChange={(e) => setName(e.target.value)}
          mb="sm"
        />
        <TextInput
          label="Email *"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          mb="sm"
        />
        <TextInput
          label="Password *"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mb="xs"
          rightSection={
            <Button size="compact-xs" variant="light" onClick={generatePassword}>
              Generate
            </Button>
          }
        />
        <NativeSelect
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data={["member", "admin", "owner"]}
          mb="md"
        />
        {error && (
          <Text size="sm" c="red" mb="sm">
            {error}
          </Text>
        )}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
