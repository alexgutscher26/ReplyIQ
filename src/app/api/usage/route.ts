import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
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

    const result = await api.generations.getSourceTotals({
      userId: session.user.id,
    });

    return Response.json(result);
  } catch (error) {
    console.error("AI generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
