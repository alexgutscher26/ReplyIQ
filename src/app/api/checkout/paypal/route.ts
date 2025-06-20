import { api } from "@/trpc/server";
import { getBaseUrl } from "@/utils";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const subscriptionId = searchParams.get("subscription_id");

  if (!token) {
    return NextResponse.redirect(getBaseUrl());
  }

  try {
    let session;
    let userId;
    let productId;

    // Handle subscription payment if subscription_id exists
    if (subscriptionId) {
      const subscription = await api.payments.getSubscription({
        subscriptionId,
      });

      // Parse the metadata string into an object
      const metadata = JSON.parse(subscription.metadata ?? "{}") as {
        userId: string;
        productId: string;
      };
      userId = metadata.userId;
      productId = metadata.productId;

      // Create new billing record for subscription
      await api.billings.createBilling({
        userId,
        productId,
        status: subscription.status,
        provider: "paypal",
        providerId: subscription.id,
        providerTransactionId: token,
        customerId: subscription.id,
        amount: subscription?.amount?.toString() ?? "0",
        currency: subscription?.currency ?? "usd",
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        metadata: {
          checkoutSessionId: token,
          subscriptionId,
          ...metadata,
        },
      });
    } else {
      // Handle one-time payment
      session = await api.payments.getSession({ sessionId: token });
      userId = session.metadata?.userId;
      productId = session.metadata?.productId;

      if (!userId || !productId) {
        return NextResponse.redirect(new URL("/error", getBaseUrl()));
      }

      // Create new billing record for one-time payment
      await api.billings.createBilling({
        userId,
        productId,
        status: session.payment?.status ?? "pending",
        provider: "paypal",
        providerId: session.payment?.id ?? "",
        providerTransactionId: session.id,
        customerId: session.customer.id,
        amount: session.payment?.amount.toString() ?? "0",
        currentPeriodStart: session.subscription?.currentPeriodStart,
        currentPeriodEnd: session.subscription?.currentPeriodEnd,
        currency: session.payment?.currency ?? "usd",
        metadata: {
          checkoutSessionId: token,
          ...session.metadata,
        },
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/dashboard?subscription_status=completed`, getBaseUrl()),
    );
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.redirect(new URL("/error", getBaseUrl()));
  }
}
