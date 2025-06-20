export interface PayPalSubscriptionResponse {
  id: string;
  status:
    | "APPROVAL_PENDING"
    | "APPROVED"
    | "ACTIVE"
    | "SUSPENDED"
    | "CANCELLED"
    | "EXPIRED";
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  shipping_amount: {
    currency_code: string;
    value: string;
  };
  subscriber: {
    email_address: string;
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
    shipping_address: {
      address: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalSubscriptionPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  billing_cycles: Array<{
    pricing_scheme: {
      fixed_price: {
        currency_code: string;
        value: string;
      };
    };
    frequency: {
      interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
      interval_count: number;
    };
    tenure_type: "REGULAR" | "TRIAL";
    sequence: number;
    total_cycles: number;
  }>;
  payment_preferences: {
    service_type?: "PREPAID" | "POSTPAID";
    auto_bill_outstanding: boolean;
    setup_fee?: {
      currency_code: string;
      value: string;
    };
    setup_fee_failure_action?: "CONTINUE" | "CANCEL";
    payment_failure_threshold: number;
  };
  taxes?: {
    percentage: string;
    inclusive: boolean;
  };
  quantity_supported: boolean;
}
