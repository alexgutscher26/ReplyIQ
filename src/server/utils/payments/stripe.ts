// stripe

import { type User } from "@/server/auth/types";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import { getBaseUrl } from "@/utils";
import Stripe from "stripe";
import { type PaymentProvider } from "./types";

export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async createCustomer({ email, name }: { email: string; name?: string }) {
    const customer = await this.stripe.customers.create({ email, name });
    return { id: customer.id };
  }

  async createSubscription({
    customerId,
    priceId,
  }: {
    customerId: string;
    priceId: string;
  }) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });
    return {
      id: subscription.id,
      status: subscription.status,
    };
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return { status: subscription.status };
  }

  async createWebhook({
    endpoint,
    events,
  }: {
    endpoint: string;
    events: Stripe.WebhookEndpointCreateParams.EnabledEvent[];
  }) {
    const webhook = await this.stripe.webhookEndpoints.create({
      url: endpoint,
      enabled_events: events,
    });

    return {
      id: webhook.id,
      status: webhook.status,
      secret: webhook.secret ?? "",
      url: webhook.url,
    };
  }

  async createCheckoutSession({
    currency,
    product,
    user,
    successUrl,
    cancelUrl,
  }: {
    currency: string;
    product: SelectProduct;
    user: User;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (!product.priceId) {
      throw new Error("Product price ID not found");
    }

    const session = await this.stripe.checkout.sessions.create({
      currency,
      mode: product.mode as Stripe.Checkout.Session.Mode,
      line_items: [
        {
          price: product.priceId, // Use stored price ID
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { userId: user.id, productId: product.id },
    });

    return { url: session.url! };
  }

  async getSubscription(subscriptionId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  }

  async getBalance() {
    const balance = await this.stripe.balance.retrieve();
    const available = balance.available[0]?.amount ?? 0;
    const pending = balance.pending[0]?.amount ?? 0;
    const currency = balance.available[0]?.currency ?? "usd";

    return {
      available: available / 100, // Convert from cents to dollars
      pending: pending / 100,
      currency: currency,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "customer",
        "subscription",
        "payment_intent",
        "line_items.data.price",
      ],
    });

    // Get customer ID based on what's available in the session
    const customerId =
      session.mode === "subscription"
        ? typeof session.customer === "string"
          ? session.customer
          : session.customer?.id
        : (session.customer_details?.email ??
          (typeof session.customer === "string"
            ? session.customer
            : session.customer?.id) ??
          (typeof session.payment_intent === "string"
            ? undefined
            : (session.payment_intent?.customer as string)));

    const result = {
      id: session.id,
      client_reference_id: session.client_reference_id ?? undefined,
      customer: {
        id: customerId ?? session.customer_details?.email ?? "", // Fallback to email if no ID yet
        name: session.customer_details?.name ?? undefined,
        email: session.customer_details?.email ?? "",
      },
      metadata: session.metadata as Record<string, string>,
    };

    // Handle subscription mode
    if (
      session.mode === "subscription" &&
      session.subscription &&
      typeof session.subscription !== "string"
    ) {
      return {
        ...result,
        subscription: {
          id: session.subscription.id,
          status: session.subscription.status,
          price: session.subscription.items.data[0]?.price.unit_amount ?? 0,
          currency: session.subscription.items.data[0]?.price.currency ?? "usd",
          interval:
            session.subscription.items.data[0]?.price.recurring?.interval ??
            "month",
          currentPeriodStart: new Date(
            session.subscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            session.subscription.current_period_end * 1000,
          ),
          trialStart: session.subscription.trial_start
            ? new Date(session.subscription.trial_start * 1000)
            : undefined,
          trialEnd: session.subscription.trial_end
            ? new Date(session.subscription.trial_end * 1000)
            : undefined,
          priceId: session.subscription.items.data[0]?.price.id ?? "", // Add priceId
        },
      };
    }

    // Handle payment mode
    if (
      session.mode === "payment" &&
      session.payment_intent &&
      typeof session.payment_intent !== "string"
    ) {
      return {
        ...result,
        payment: {
          id: session.payment_intent.id,
          status: session.payment_intent.status,
          amount: session.payment_intent.amount,
          currency: session.payment_intent.currency,
          priceId: session.line_items?.data[0]?.price?.id ?? "", // Add priceId
        },
      };
    }

    throw new Error("Invalid session mode or missing data");
  }

  async manageBillingPortal(customerId: string): Promise<{ url: string }> {
    let configuration: Stripe.BillingPortal.Configuration;
    const configurations =
      await this.stripe.billingPortal.configurations.list();

    if (!configurations.data[0]) {
      configuration = await this.stripe.billingPortal.configurations.create({
        business_profile: {
          privacy_policy_url: `${getBaseUrl()}/privacy`,
          terms_of_service_url: `${getBaseUrl()}/terms`,
        },
        features: {
          customer_update: { enabled: false },
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_update: { enabled: false }, // Disable subscription updates
          subscription_cancel: {
            enabled: true,
            mode: "at_period_end",
            cancellation_reason: {
              enabled: true,
              options: [
                "too_expensive",
                "missing_features",
                "switched_service",
                "unused",
                "other",
              ] as const,
            },
          },
        },
      });
    } else {
      configuration = configurations.data[0];
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: configuration.id,
      return_url: `${getBaseUrl()}/dashboard/settings/account`,
    });

    return { url: session.url };
  }

  async updateSubscription({
    subscriptionId,
    priceId,
  }: {
    subscriptionId: string;
    priceId: string;
  }) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new Error("No subscription item found");
    }

    const updatedSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: itemId,
            price: priceId,
          },
        ],
      },
    );

    return {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
    };
  }

  async updatePrice(priceId: string, data: { active: boolean }) {
    const price = await this.stripe.prices.update(priceId, data);
    return {
      id: price.id,
      active: price.active,
    };
  }

  async createPrice(params: {
    unit_amount: number;
    currency: string;
    product_data: {
      name: string;
      description?: string;
    };
    recurring?: {
      interval: "day" | "week" | "month" | "year";
    };
  }) {
    // First create a Stripe product
    const product = await this.stripe.products.create({
      name: params.product_data.name,
      description: params.product_data.description,
    });

    // Then create a price for that product
    const price = await this.stripe.prices.create({
      unit_amount: params.unit_amount,
      currency: params.currency,
      product: product.id,
      ...(params.recurring && {
        recurring: params.recurring,
      }),
    });

    return {
      id: price.id,
    };
  }
}
