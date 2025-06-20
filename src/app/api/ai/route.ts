import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { type GenerationsType } from "@/utils/schema/generations";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as GenerationsType;

    const { tone, source, link, post, author, type } = body;

    if (!tone || !source || !post || !type) {
      return Response.json(
        { error: "tone, source, post, and type are required" },
        { status: 400 },
      );
    }

    // Use api utility to call generate procedure with all fields
    const result = await api.generations.generate({
      source,
      link,
      post,
      tone,
      type,
      author,
    });

    return Response.json(result);
  } catch (error) {
    console.error("AI generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
