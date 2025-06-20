"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/use-auth-hooks";
import { api } from "@/trpc/react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PricingTable() {
  const router = useRouter();
  const { user } = useSession();
  const [products] = api.products.active.useSuspenseQuery();
  const [currency] = api.settings.currency.useSuspenseQuery();

  // Add checkout mutation
  const { mutate: checkout, isPending: isCheckingOut } =
    api.payments.createCheckout.useMutation({
      onSuccess: ({ url, type }) => {
        if (type === "free") {
          router.push("/dashboard/settings/account");
          return;
        }
        router.push(url);
      },
      onError: (error) => {
        toast.error("Failed to create checkout session", {
          description: error.message,
        });
      },
    });

  // Handle plan selection
  const handlePlanSelection = (productId: string) => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    checkout({ productId });
  };

  return (
    <section className="py-16 md:py-32" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Pricing that Scales with You
          </h1>
          <p>
            Choose a plan that works for you. All plans include premium features
            and dedicated support to help you grow your business.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`flex flex-col ${product.name === "Pro" ? "relative" : ""}`}
            >
              {product.name === "Pro" && (
                <span className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full bg-linear-to-br/increasing from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-white/20 ring-offset-1 ring-offset-gray-950/5 ring-inset">
                  Popular
                </span>
              )}

              <CardHeader>
                <CardTitle className="font-medium">{product.name}</CardTitle>
                <span className="my-3 block text-2xl font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency.toUpperCase(),
                    currencySign: "standard",
                  }).format(Number(product.price))}{" "}
                  / {product.type}
                </span>
                <CardDescription className="text-sm">
                  Per account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />
                <ul className="list-outside space-y-3 text-sm">
                  {product.marketingTaglines?.map((tagline) => {
                    const values =
                      typeof tagline === "string"
                        ? tagline
                        : (tagline as { values: string }).values;

                    return (
                      <li key={values} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {values}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button
                  variant={product.name === "Pro" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handlePlanSelection(product.id)}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : !user ? (
                    "Sign in to Get Started"
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
