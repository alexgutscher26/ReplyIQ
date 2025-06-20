import { ourFileRouter } from "@/app/api/uploadthing/core";
import { api } from "@/trpc/server";
import { type NextRequest } from "next/server";
import { createRouteHandler } from "uploadthing/next";

async function createHandlerWithToken() {
  const token = (await api.settings.storageProviderKey()) ?? undefined;

  return createRouteHandler({
    router: ourFileRouter,
    config: { token },
  });
}

export async function GET(request: NextRequest) {
  const handler = await createHandlerWithToken();
  return handler.GET(request);
}

export async function POST(request: NextRequest) {
  const handler = await createHandlerWithToken();
  return handler.POST(request);
}
