import api from "@/lib/api-client";

// Stats
export async function getAdminStats() {
  const res = await api.post("/admin/stats");
  return res.data;
}

export async function getAdminChartData() {
  const res = await api.post("/admin/stats/charts");
  return res.data;
}

// Users
export async function getAdminUsers() {
  const res = await api.post("/admin/users");
  return res.data;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const res = await api.post("/admin/users/create", input);
  return res.data;
}

export async function toggleUserActive(userId: string, active: boolean) {
  const res = await api.post("/admin/users/toggle-active", { userId, active });
  return res.data;
}

export async function deleteAdminUser(userId: string) {
  const res = await api.post("/admin/users/delete", { userId });
  return res.data;
}

// Pages
export async function getAdminPages() {
  const res = await api.post("/admin/pages");
  return res.data;
}

// Files
export async function getAdminFiles() {
  const res = await api.post("/admin/files");
  return res.data;
}
