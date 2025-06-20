// route

import { api } from "@/trpc/server";
import { getBaseUrl } from "@/utils";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(getBaseUrl());
  }

  try {
    const session = await api.payments.getSession({ sessionId });
    const userId =
      session.client_reference_id ?? session.metadata?.userId ?? "";

    // check if user exists
    await api.user.getAuser(userId);

    // Create new billing record based on session mode
    if (session.subscription) {
      await api.billings.createBilling({
        userId,
        productId: session.metadata.productId ?? "",
        status: session.subscription.status,
        provider: "stripe",
        providerId: session.subscription.id,
        providerTransactionId: session.payment?.id,
        customerId: session.customer.id,
        amount: (session.subscription.price / 100).toString(),
        currency: session.subscription.currency,
        interval: session.subscription.interval,
        currentPeriodStart: session.subscription.currentPeriodStart,
        currentPeriodEnd: session.subscription.currentPeriodEnd,
        metadata: {
          checkoutSessionId: sessionId,
          ...session.metadata,
        },
      });
    } else if (session.payment) {
      await api.billings.createBilling({
        userId,
        productId: session.metadata.productId ?? "",
        status: session.payment.status,
        provider: "stripe",
        providerId: session.payment.id,
        providerTransactionId: session.payment.id,
        customerId: session.customer.id,
        amount: (session.payment.amount / 100).toString(),
        currency: session.payment.currency,
        metadata: {
          checkoutSessionId: sessionId,
          ...session.metadata,
        },
      });
    }

    // Redirect to success page
    const status =
      session.subscription?.status ?? session.payment?.status ?? "completed";
    return NextResponse.redirect(
      new URL(`/dashboard?subscription_status=${status}`, getBaseUrl()),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/error", getBaseUrl()));
  }
}
