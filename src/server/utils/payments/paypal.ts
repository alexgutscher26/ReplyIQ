/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User } from "@/server/auth/types";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  ClientCredentialsAuthManager,
  Environment,
  LogLevel,
  OrderApplicationContextShippingPreference,
  OrderApplicationContextUserAction,
  OrdersController,
  PaymentsController,
  type ApiResponse,
  type OAuthToken,
  type OrderRequest,
} from "@paypal/paypal-server-sdk";
import {
  type PayPalSubscriptionPlan,
  type PayPalSubscriptionResponse,
} from "./paypal-types";
import { type PaymentProvider } from "./types";

// PayPal error response type
type PayPalError = {
  name: string;
  message: string;
  debug_id?: string;
  details?: Array<{
    issue: string;
    description?: string;
  }>;
};

export class PayPalPaymentProvider implements PaymentProvider {
  private client: Client;
  private ordersController: OrdersController;
  private paymentsController: PaymentsController;
  private authManager: ClientCredentialsAuthManager;
  private baseUrl: string;

  constructor(
    private apiKey: string,
    private clientSecret: string,
  ) {
    this.baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://api.paypal.com"
        : "https://api.sandbox.paypal.com";

    // Initialize PayPal client with OAuth credentials
    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: apiKey,
        oAuthClientSecret: clientSecret,
        // Add OAuth token update callback to handle token refresh
        oAuthOnTokenUpdate: (token: OAuthToken) => {
          this.currentToken = token;
        },
      },
      timeout: 30000,
      environment:
        process.env.NODE_ENV === "production"
          ? Environment.Production
          : Environment.Sandbox,
      logging:
        process.env.NODE_ENV === "development"
          ? {
              logLevel: LogLevel.Info,
              logRequest: { logBody: true },
              logResponse: { logHeaders: true },
            }
          : undefined,
    });

    // Initialize controllers
    this.ordersController = new OrdersController(this.client);
    this.paymentsController = new PaymentsController(this.client);

    // Initialize auth manager with both required arguments
    this.authManager = new ClientCredentialsAuthManager(
      {
        oAuthClientId: this.apiKey,
        oAuthClientSecret: this.clientSecret,
      },
      this.client, // Pass the client instance as second argument
    );
  }
  getBalance(): Promise<{ available: number; pending: number; currency: string; }> {
    throw new Error("Method not implemented.");
  }

  private currentToken?: OAuthToken;

  private async getAccessToken(): Promise<string> {
    // Use the SDK's auth manager to get/refresh token with additional scopes
    if (!this.currentToken || this.authManager.isExpired(this.currentToken)) {
      this.currentToken = await this.authManager.fetchToken();
    }

    return this.currentToken.accessToken;
  }

  // Helper for making authenticated REST API calls
  private async fetchWithAuth(path: string, init?: RequestInit) {
    const token = await this.getAccessToken();

    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
        ...init?.headers,
      },
    });
  }

  // Update subscription-related methods to use fetchWithAuth
  async createSubscription({
    customerId,
    priceId,
    returnUrl,
    cancelUrl,
    metadata,
  }: {
    customerId: string;
    priceId: string;
    returnUrl: string;
    cancelUrl: string;
    metadata: {
      userId: string;
      productId: string;
    };
  }) {
    try {
      const response = await this.fetchWithAuth("/v1/billing/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: priceId,
          subscriber: {
            email_address: customerId,
          },
          custom_id: JSON.stringify(metadata), // Add metadata here
          application_context: {
            brand_name: "Your Brand",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
            payment_method: {
              payer_selected: "PAYPAL",
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
            },
          },
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as PayPalError;
        throw new Error(
          `PayPal subscription creation failed: ${JSON.stringify(error)}`,
        );
      }

      const subscription =
        (await response.json()) as PayPalSubscriptionResponse;
      return {
        id: subscription.id,
        status: subscription.status.toLowerCase(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error during subscription creation");
    }
  }

  // Update other REST API methods to use fetchWithAuth
  async createPrice(params: {
    unit_amount: number;
    currency: string;
    product_data: { name: string; description?: string };
    recurring?: { interval: "day" | "week" | "month" | "year" };
  }): Promise<{ id: string }> {
    try {
      // Create product using fetchWithAuth
      const productResponse = await this.fetchWithAuth(
        "/v1/catalogs/products",
        {
          method: "POST",
          body: JSON.stringify({
            name: params.product_data.name,
            description: params.product_data.description,
            type: "DIGITAL",
            category: "SOFTWARE",
          }),
        },
      );

      const responseText = await productResponse.text();

      if (!productResponse.ok) {
        const error = JSON.parse(responseText) as PayPalError;
        throw new Error(`Failed to create product: ${JSON.stringify(error)}`);
      }

      const product = JSON.parse(responseText) as { id: string };

      // Create billing plan using fetchWithAuth
      const planResponse = await this.fetchWithAuth("/v1/billing/plans", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          name: params.product_data.name,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: {
                interval_unit:
                  params.recurring?.interval.toUpperCase() ?? "MONTH",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: (params.unit_amount / 100).toString(),
                  currency_code: params.currency.toUpperCase(),
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            payment_failure_threshold: 1,
          },
        }),
      });

      const planResponseText = await planResponse.text();

      if (!planResponse.ok) {
        const error = JSON.parse(planResponseText) as PayPalError;
        throw new Error(`Failed to create plan: ${JSON.stringify(error)}`);
      }

      const plan = JSON.parse(planResponseText) as PayPalSubscriptionPlan;
      return { id: plan.id };
    } catch (error) {
      console.error("PayPal Error:", error);
      throw error;
    }
  }

  async createCustomer({ email, name }: { email: string; name?: string }) {
    // PayPal doesn't have a direct customer creation API
    // We'll store customer info in our database instead
    return { id: email, name }; // Use email as customer ID
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
    // Handle subscription mode
    if (product.mode === "subscription" && product.priceId) {
      const { id: subscriptionId } = await this.createSubscription({
        customerId: user.email,
        priceId: product.priceId,
        returnUrl: successUrl,
        cancelUrl: cancelUrl,
        metadata: {
          // Add metadata here
          userId: user.id,
          productId: product.id,
        },
      });

      // Get subscription details to get approval URL
      const response = await this.fetchWithAuth(
        `/v1/billing/subscriptions/${subscriptionId}`,
      );

      if (!response.ok) {
        const error = (await response.json()) as PayPalError;
        throw new Error(
          `PayPal subscription fetch failed: ${JSON.stringify(error)}`,
        );
      }

      const subscription =
        (await response.json()) as PayPalSubscriptionResponse;
      const approvalLink = subscription.links.find(
        (link) => link.rel === "approve",
      )?.href;

      if (!approvalLink) {
        throw new Error(
          "No approval URL found in PayPal subscription response",
        );
      }

      return { url: approvalLink };
    }

    const orderRequest: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency.toUpperCase(),
            value: product.price.toString(),
          },
          description: product.description ?? undefined,
          referenceId: product.id,
          customId: JSON.stringify({
            userId: user.id,
            productId: product.id,
          }),
        },
      ],
      applicationContext: {
        returnUrl: successUrl,
        cancelUrl: cancelUrl,
        userAction: OrderApplicationContextUserAction.PayNow,
        shippingPreference:
          OrderApplicationContextShippingPreference.NoShipping,
      },
    };

    try {
      const { result } = await this.ordersController.ordersCreate({
        body: orderRequest,
        prefer: "return=representation",
      });

      const approvalUrl = result.links?.find(
        (link) => link.rel === "approve",
      )?.href;

      if (!approvalUrl) {
        throw new Error("No approval URL found in PayPal response");
      }

      // Return the approval URL
      return { url: approvalUrl };
    } catch (error) {
      if (error instanceof ApiError) {
        const paypalError = (error as ApiError<ApiResponse<PayPalError>>)
          .result;
        throw new Error(
          `PayPal checkout creation failed: ${JSON.stringify(paypalError)}`,
        );
      }
      throw error;
    }
  }

  async getSession(sessionId: string) {
    try {
      const { result } = await this.ordersController.ordersGet({
        id: sessionId,
      });

      if (!result.id) {
        throw new Error("Invalid PayPal order response - missing ID");
      }

      return {
        id: result.id, // Now guaranteed to be string
        customer: {
          id: result.payer?.payerId ?? result.id, // Fallback to order ID if no payer ID
          email: result.payer?.emailAddress ?? "",
          name: result.payer?.name
            ? `${result.payer.name.givenName ?? ""} ${
                result.payer.name.surname ?? ""
              }`.trim()
            : undefined,
        },
        payment: result.status
          ? {
              id: result.id,
              status: result.status,
              amount: parseFloat(
                result.purchaseUnits?.[0]?.amount?.value ?? "0",
              ),
              currency:
                result.purchaseUnits?.[0]?.amount?.currencyCode?.toLowerCase() ??
                "usd",
              priceId: result.purchaseUnits?.[0]?.referenceId ?? "",
            }
          : undefined,
        metadata: result.purchaseUnits?.[0]?.customId
          ? (JSON.parse(result.purchaseUnits?.[0].customId) as {
              userId: string;
              productId: string;
            })
          : {},
      };
    } catch (error) {
      if (error instanceof ApiError) {
        const paypalError = (error as ApiError<ApiResponse<PayPalError>>)
          .result;
        throw new Error(
          `PayPal session retrieval failed: ${JSON.stringify(paypalError)}`,
        );
      }
      throw error;
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const response = await this.fetchWithAuth(
        `/v1/billing/subscriptions/${subscriptionId}`,
      );

      if (!response.ok) {
        const error = (await response.json()) as PayPalError;
        throw new Error(`Failed to get subscription: ${JSON.stringify(error)}`);
      }

      const subscription =
        (await response.json()) as PayPalSubscriptionResponse & {
          custom_id: string;
        };

      return {
        id: subscription.id,
        status: subscription.status.toLowerCase(),
        amount: parseFloat(subscription.billing_info.last_payment.amount.value),
        currency: subscription.billing_info.last_payment.amount.currency_code,
        currentPeriodStart: new Date(subscription.start_time),
        currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
        metadata: subscription.custom_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error while fetching subscription");
    }
  }

  async updateSubscription({
    subscriptionId,
    priceId,
  }: {
    subscriptionId: string;
    priceId: string;
  }): Promise<{ id: string; status: string }> {
    // throw new Error("Method not implemented.");
    const response = await this.fetchWithAuth(
      `/v1/billing/subscriptions/${subscriptionId}/revise`,
      {
        method: "POST",
        body: JSON.stringify({
          plan_id: priceId,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as PayPalError;
      throw new Error(
        `Failed to update subscription: ${JSON.stringify(error)}`,
      );
    }

    const updatedSubscription = (await response.json()) as {
      id: string;
      status: string;
    };

    return {
      id: updatedSubscription.id,
      status: updatedSubscription.status.toLowerCase(),
    };
  }
  updatePrice(
    priceId: string,
    data: { active: boolean },
  ): Promise<{ id: string; active: boolean }> {
    throw new Error(`Method not implemented. ${priceId} ${data.active}`);
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await this.fetchWithAuth(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: "Canceled by customer",
          }),
        },
      );

      if (!response.ok) {
        const error = (await response.json()) as PayPalError;
        throw new Error(
          `Failed to cancel subscription: ${JSON.stringify(error)}`,
        );
      }

      return { status: "cancelled" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error while canceling subscription");
    }
  }

  async createWebhook({
    endpoint,
    events,
  }: {
    endpoint: string;
    events: string[];
  }) {
    const webhook = await this.fetchWithAuth("/v1/notifications/webhooks", {
      method: "POST",
      body: JSON.stringify({
        url: endpoint,
        event_types: events.map((event) => ({ name: event })),
      }),
    });

    if (!webhook.ok) {
      const error = (await webhook.json()) as PayPalError;
      throw new Error(`Failed to create webhook: ${JSON.stringify(error)}`);
    }

    const webhookData = (await webhook.json()) as {
      id: string;
      url: string;
      event_types: { name: string; description: string }[];
    };

    return {
      id: webhookData.id,
      status: "active",
      secret: webhookData.id, // Use webhook ID as secret
      url: webhookData.url,
    };
  }

  /**
   * Throws an error indicating that the method is not implemented.
   */
  manageBillingPortal(customerId: string): Promise<{ url: string }> {
    throw new Error(`Method not implemented. ${customerId}`);
  }
}
