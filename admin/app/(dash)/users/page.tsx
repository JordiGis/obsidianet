import { listUsers } from "@/lib/queries";
import UsersClient from "@/components/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await listUsers();
  return <UsersClient initial={JSON.parse(JSON.stringify(users))} />;
}
