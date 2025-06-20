// types

import { type User } from "@/server/auth/types";
import { type SelectProduct } from "@/server/db/schema/products-schema";

export interface PaymentProvider {
  createCustomer(params: { email: string; name?: string }): Promise<{
    id: string;
  }>;

  createSubscription(params: { customerId: string; priceId: string }): Promise<{
    id: string;
    status: string;
  }>;

  cancelSubscription(subscriptionId: string): Promise<{
    status: string;
  }>;

  createWebhook(params: { endpoint: string; events: string[] }): Promise<{
    id: string;
    status: string;
    secret: string;
    url: string;
  }>;

  createCheckoutSession(params: {
    currency: string;
    product: SelectProduct;
    user: User;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{
    url: string;
  }>;

  getSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    amount?: number;
    currency?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd: Date;
    metadata?: string;
  }>;

  getBalance(): Promise<{
    available: number;
    pending: number;
    currency: string;
  }>;

  getSession(sessionId: string): Promise<{
    id: string;
    client_reference_id?: string;
    customer: {
      id: string;
      name?: string;
      email: string;
    };
    payment?: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      priceId: string; // Add this
    };
    subscription?: {
      id: string;
      status: string;
      price: number;
      currency: string;
      interval: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      trialStart?: Date;
      trialEnd?: Date;
      priceId: string; // Add this
    };
    metadata: Record<string, string>;
  }>;

  manageBillingPortal(customerId: string): Promise<{
    url: string;
  }>;

  updateSubscription(params: {
    subscriptionId: string;
    priceId: string; // Changed from newProductId to priceId
  }): Promise<{
    id: string;
    status: string;
  }>;

  updatePrice(
    priceId: string,
    data: {
      active: boolean;
    },
  ): Promise<{
    id: string;
    active: boolean;
  }>;

  createPrice(params: {
    unit_amount: number;
    currency: string;
    product_data: {
      name: string;
      description?: string;
    };
    recurring?: {
      interval: "day" | "week" | "month" | "year";
    };
  }): Promise<{
    id: string;
  }>;
}

export interface PaymentCustomer {
  id: string;
  email: string;
  name?: string;
}

export interface PaymentSubscription {
  id: string;
  status: string;
  customerId: string;
  priceId: string;
  currentPeriodEnd: Date;
}

export interface CheckoutSession {
  id: string;
  url: string;
}
