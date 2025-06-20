import { Separator } from "@/components/ui/separator";
import { AccountForm } from "./_components/account-form";
import CancelPlanForm from "./_components/cancel-plan-form";
import CurrentPlanForm from "./_components/current-plan-form";
import DownloadExtensionForm from "./_components/download-extension-form";
import UsagePlanForm from "./_components/usage-plan-form";

export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account, billing, and download browser extensions.
        </p>
      </div>
      <Separator />
      <CurrentPlanForm />
      <UsagePlanForm />
      <DownloadExtensionForm />
      <AccountForm />
      <CancelPlanForm />
    </div>
  );
}
