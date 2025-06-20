import { authClient } from "@/server/auth/client";
import { useQuery } from "@tanstack/react-query";

export function useListSessions() {
  return useQuery({
    queryKey: ["listSessions"],
    queryFn: async () => {
      return await authClient.listSessions({ fetchOptions: { throw: true } });
    },
  });
}
