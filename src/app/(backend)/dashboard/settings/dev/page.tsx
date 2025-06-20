import SeedGeneralForm from "@/app/(backend)/dashboard/settings/dev/_components/seed-form";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { redirect } from "next/navigation";

export default async function SeedGeneralPage() {
  const session = await getSession();

  if (session?.user?.role !== "admin") {
    return redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Developer</h3>
        <p className="text-sm text-muted-foreground">
          Manage developer settings and seed the database.
        </p>
      </div>
      <Separator />
      <SeedGeneralForm />
    </div>
  );
}
