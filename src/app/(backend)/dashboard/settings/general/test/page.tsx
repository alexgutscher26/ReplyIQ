"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { getBaseUrl } from "@/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TestPage() {
  const router = useRouter();
  const checkout = api.payments.createCheckout.useMutation();
  const generate = api.generations.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Generation complete", {
        description: data.text,
      });
    },
    onError: (error) => {
      toast.error("Generation failed", {
        description: error.message,
      });
    },
  });

  const handleCheckout = async () => {
    try {
      const { url } = await checkout.mutateAsync({
        // productId: "eb3db3ee-dda1-44db-9b47-c75197d0008b",
        productId: "ea882b00-78c3-41c8-96d8-08dc9d104627",
      });

      // Redirect to Stripe Checkout
      router.push(url);
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  return (
    <div className="p-4">
      <Button onClick={handleCheckout} disabled={checkout.isPending}>
        {checkout.isPending ? "Loading..." : "Start Checkout"}
      </Button>

      {checkout.error && (
        <p className="mt-4 text-red-500">{checkout.error.message}</p>
      )}

      <Button
        onClick={() =>
          generate.mutateAsync({
            post: "Groningen is very windy during winter and I hate it",
            source: "test",
            type: "reply",
            link: "https://example.com",
            tone: "friendly",
            author: "Test User",
          })
        }
        disabled={generate.isPending}
        variant="destructive"
      >
        {generate.isPending ? "Generating..." : "Generate"}
      </Button>
      <Button
        onClick={async () => {
          const response = await fetch(`${getBaseUrl()}/api/ai`, {
            method: "POST",
            // credentials: "include", // Add this line to include auth cookies
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              post: "Groningen is very windy during winter and I hate it",
              prompt:
                "What do you think of Groningen? Think fast and respond in short",
              source: "test",
              link: "https://example.com",
              author: "Test User",
            }),
          });

          if (!response.ok) {
            const errorData = (await response.json()) as {
              error: string;
              status: number;
            };

            toast.error("API request failed", {
              description: errorData.error || "Something went wrong.",
            });

            return;
          }

          const data = (await response.json()) as {
            text: string;
            remainingUsage: number;
          };

          toast.success("API request successful", {
            description: data.text || "No result returned.",
          });
        }}
      >
        Generate (API)
      </Button>
    </div>
  );
}
