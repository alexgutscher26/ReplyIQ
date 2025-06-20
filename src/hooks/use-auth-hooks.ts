import { authClient } from "@/server/auth/client";
import { createAuthHooks } from "@daveyplate/better-auth-tanstack";

export const {
  useSession,
  usePrefetchSession,
  useToken,
  useListAccounts,
  useListSessions,
  useListDeviceSessions,
  useListPasskeys,
  useDeletePasskey,
  useUnlinkAccount,
  useRevokeDeviceSession,
  useRevokeSession,
  useRevokeOtherSessions,
  useRevokeSessions,
  useSetActiveSession,
  useUpdateUser,
} = createAuthHooks(authClient);
