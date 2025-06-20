import { ActiveSessionUserCardSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/active-session-user-card-settings";
import { DeleteAccountCardSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/delete-account-card-settings";
import { OtherSessionsUserCardSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/other-sessions-user-card-settings";
import { UpdateUserEmailSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/update-user-email-settings";
import { UpdateUserPasswordSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/update-user-password-settings";
import { UpdateUserProfileSettingsForm } from "@/app/(backend)/dashboard/settings/profile/_components/update-user-profile-settings-form";
import { Separator } from "@/components/ui/separator";

export default async function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your profile information.
        </p>
      </div>
      <Separator />
      <UpdateUserProfileSettingsForm />
      <UpdateUserEmailSettingsForm />
      <UpdateUserPasswordSettingsForm />
      <ActiveSessionUserCardSettingsForm />
      <OtherSessionsUserCardSettingsForm />
      <DeleteAccountCardSettingsForm />
    </div>
  );
}
