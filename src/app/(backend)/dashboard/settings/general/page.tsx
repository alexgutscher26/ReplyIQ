import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { redirect } from "next/navigation";
import { MailConfigurationForm } from "../account/_components/mail-configuration-form";
import { DownloadExtensionSettingsForm } from "./_components/download-extension-settings-form";
import { TestAiConnectionStatusForm } from "./_components/test-ai-connection-status-form";
import { TestPaymentProviderConnectionStatusForm } from "./_components/test-payment-provider-connection-status-form";
import { TestResendMailConnectionStatusForm } from "./_components/test-resend-mail-connection-status-form";
import { TestStorageProviderConnectionStatusForm } from "./_components/test-storage-provider-connection-status-form";
import { UpdateAiModelProviderSettingsForm } from "./_components/update-ai-model-provider-settings-form";
import { UpdateAuthSocialProviderForm } from "./_components/update-auth-social-provider-form";
import { UpdatePaymentProviderSettingsForm } from "./_components/update-payment-provider-settings-form";
import { UpdateSiteSettingsForm } from "./_components/update-site-settings-form";
import { UpdateStorageProviderSettingsForm } from "./_components/update-storage-provider-settings-form";
import UpdateWebhookForStripeForm from "./_components/update-webhook-for-stripe-form";

export default async function SettingsGeneralPage() {
  const session = await getSession();

  if (session?.user?.role !== "admin") {
    return redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General</h3>
        <p className="text-sm text-muted-foreground">
          Update your account settings. Set your preferred language and
          timezone.
        </p>
      </div>
      <Separator />
      <UpdateSiteSettingsForm />
      <UpdateAuthSocialProviderForm />
      <UpdateAiModelProviderSettingsForm />
      <UpdatePaymentProviderSettingsForm />
      <UpdateWebhookForStripeForm />
      <UpdateStorageProviderSettingsForm />
      <DownloadExtensionSettingsForm />
      <MailConfigurationForm />
      <TestAiConnectionStatusForm />
      <TestPaymentProviderConnectionStatusForm />
      <TestStorageProviderConnectionStatusForm />
      <TestResendMailConnectionStatusForm />
    </div>
  );
}
