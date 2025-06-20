import { api } from "@/trpc/server";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

// PayPal webhook event types
type PayPalWebhookEvent = {
  id: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: {
    id: string;
    state: string; // This is the status (e.g., "Cancelled")
    description?: string;
    start_date: string;
    agreement_details: {
      outstanding_balance: {
        value: string;
      };
      last_payment_date: string;
      last_payment_amount: {
        value: string;
      };
      next_billing_date?: string;
      failed_payment_count: string;
    };
    plan: {
      payment_definitions: Array<{
        type: string;
        frequency: string;
        amount: {
          value: string;
          currency_code?: string;
        };
      }>;
    };
    payer: {
      payment_method: string;
      status: string;
      payer_info: {
        email: string;
        first_name: string;
        last_name: string;
        payer_id: string;
      };
    };
  };
  event_version: string;
};

function verifyPayPalWebhookSignature(
  rawEvent: string,
  headers: Headers,
  webhookId: string,
) {
  try {
    // Get all required headers exactly as PayPal sends them
    const transmissionId = headers.get("paypal-transmission-id");
    const transmissionTime = headers.get("paypal-transmission-time");
    const certUrl = headers.get("paypal-cert-url");
    const authAlgo = headers.get("paypal-auth-algo");
    const authVersion = headers.get("paypal-auth-version");
    const transmissionSig = headers.get("paypal-transmission-sig");

    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
      console.error("Missing required PayPal headers");
      return false;
    }

    // PayPal uses raw request body without any transformation
    const validationMessage = [
      transmissionId,
      transmissionTime,
      webhookId,
      crypto.createHash("sha256").update(rawEvent).digest("hex"),
    ].join("|");

    console.log({
      validationMessage,
      transmissionId,
      transmissionTime,
      webhookId,
      certUrl,
      authAlgo,
      authVersion,
      // Log first few chars of sig for debugging
      sigPreview: transmissionSig.substring(0, 50) + "...",
    });

    // Create verifier using the algorithm specified by PayPal
    const verifier = crypto.createVerify(
      authAlgo?.replace("with", "-").toUpperCase() ?? "SHA256-RSA",
    );
    verifier.update(validationMessage);

    // Verify the signature
    const verified = verifier.verify(
      certUrl, // In production: fetch and cache this cert
      Buffer.from(transmissionSig, "base64"),
    );

    if (!verified) {
      console.error("PayPal signature verification failed");
    }

    return verified;
  } catch (error) {
    console.error("PayPal signature verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const webhookId = await api.settings.webhookSecretForPaymentProvider();
  if (!webhookId) {
    return new Response("Missing webhook configuration", { status: 400 });
  }

  const payload = await request.text();

  // Verify webhook signature with all headers
  const isValid = verifyPayPalWebhookSignature(
    payload,
    request.headers,
    webhookId,
  );

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    const event = JSON.parse(payload) as PayPalWebhookEvent;

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.UPDATED":
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subscription = event.resource;
        try {
          // Convert PayPal format to our billing format
          await api.billings.updateBilling({
            provider: "paypal",
            subscription: {
              id: subscription.id,
              status: subscription.state.toLowerCase(),
              start_time: subscription.start_date,
              billing_info: {
                next_billing_time:
                  subscription.agreement_details.next_billing_date ??
                  // If no next billing date (cancelled), use last payment date
                  subscription.agreement_details.last_payment_date,
              },
              cancel_at_period_end:
                event.event_type === "BILLING.SUBSCRIPTION.CANCELLED",
              canceled_at:
                event.event_type === "BILLING.SUBSCRIPTION.CANCELLED"
                  ? event.create_time
                  : undefined,
            },
          });

          console.log(
            `PayPal subscription ${subscription.id} status updated to: ${subscription.state}`,
          );
        } catch (error) {
          if (error instanceof TRPCError && error.code === "NOT_FOUND") {
            console.log(
              `Subscription not found in database: ${subscription.id}`,
            );
            return NextResponse.json({
              received: true,
              warning: "Subscription not found in database",
            });
          }
          throw error;
        }
        break;
      }
      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing PayPal webhook:", error);
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
