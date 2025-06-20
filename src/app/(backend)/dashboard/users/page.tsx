import UsersTable from "@/app/(backend)/dashboard/users/_components/users-table";
import { api } from "@/trpc/server";

export default async function UsersPage() {
  const totalUsers = await api.user.total();

  return <UsersTable totalUsers={totalUsers} />;
}
