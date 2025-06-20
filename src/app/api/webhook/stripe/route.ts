import { api } from "@/trpc/server";
import { TRPCError } from "@trpc/server";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const webhookSecret =
    (await api.settings.webhookSecretForPaymentProvider()) ?? "";

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("customer", subscription.customer);
        try {
          await api.billings.updateBilling({
            provider: "stripe",
            subscription: subscription,
          });
          console.log(
            `Subscription ${subscription.id} status updated to: ${subscription.status}`,
          );
        } catch (error) {
          if (error instanceof TRPCError && error.code === "NOT_FOUND") {
            // Log the error but don't fail the webhook
            console.log(
              `Subscription not found in database: ${subscription.id}. This is normal for test events.`,
            );
            return NextResponse.json({
              received: true,
              warning: "Subscription not found in database",
            });
          }
          // Re-throw other errors
          throw error;
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Error processing webhook",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
