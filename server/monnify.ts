import axios from "axios";
import { ENV } from "./_core/env";

const monnifyClient = axios.create({
  baseURL: process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com",
  auth: {
    username: process.env.MONNIFY_API_KEY || "",
    password: process.env.MONNIFY_SECRET_KEY || "",
  },
});

export interface MonnifyPaymentRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode: string;
  contractCode: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}

export interface MonnifyPaymentResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody?: {
    transactionReference: string;
    paymentLink: string;
    accessToken: string;
    checkoutUrl: string;
  };
}

export interface MonnifyWebhookPayload {
  eventType: string;
  eventData: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: number;
    paidOn: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentDescription: string;
    currency: string;
    customer: {
      email: string;
      name: string;
    };
    metaData: Record<string, any>;
  };
}

/**
 * Initialize a payment transaction with Monnify
 */
export async function initiateMonnifyPayment(
  request: MonnifyPaymentRequest
): Promise<MonnifyPaymentResponse> {
  try {
    const response = await monnifyClient.post<MonnifyPaymentResponse>(
      "/api/v1/merchant/transactions/init-transaction",
      {
        amount: request.amount,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        paymentReference: request.paymentReference,
        paymentDescription: request.paymentDescription,
        currencyCode: request.currencyCode,
        contractCode: request.contractCode,
        redirectUrl: request.redirectUrl,
        incomeSplitConfig: null,
        metadata: request.metadata,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Monnify] Payment initiation failed:", error.response?.data || error.message);
    throw new Error(`Failed to initiate payment: ${error.response?.data?.responseMessage || error.message}`);
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyMonnifyPayment(
  transactionReference: string
): Promise<{
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody?: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: number;
    totalAmount: number;
    paidOn: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentDescription: string;
    currency: string;
    customer: {
      email: string;
      name: string;
    };
    metaData: Record<string, any>;
  };
}> {
  try {
    const response = await monnifyClient.get(
      `/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`
    );

    return response.data;
  } catch (error: any) {
    console.error("[Monnify] Payment verification failed:", error.response?.data || error.message);
    throw new Error(`Failed to verify payment: ${error.response?.data?.responseMessage || error.message}`);
  }
}

/**
 * Get transaction details
 */
export async function getMonnifyTransactionDetails(
  transactionReference: string
): Promise<any> {
  try {
    const response = await verifyMonnifyPayment(transactionReference);
    return response.responseBody;
  } catch (error) {
    console.error("[Monnify] Failed to get transaction details:", error);
    throw error;
  }
}

/**
 * Validate webhook signature
 */
export function validateMonnifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    // Monnify uses HMAC-SHA512 for webhook signatures
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", process.env.MONNIFY_SECRET_KEY || "")
      .update(payload)
      .digest("hex");

    return hash === signature;
  } catch (error) {
    console.error("[Monnify] Webhook signature validation failed:", error);
    return false;
  }
}

/**
 * Parse webhook payload
 */
export function parseMonnifyWebhook(payload: MonnifyWebhookPayload): {
  transactionReference: string;
  paymentReference: string;
  amount: number;
  status: string;
  customerEmail: string;
  metadata: Record<string, any>;
} {
  return {
    transactionReference: payload.eventData.transactionReference,
    paymentReference: payload.eventData.paymentReference,
    amount: payload.eventData.amountPaid,
    status: payload.eventData.paymentStatus,
    customerEmail: payload.eventData.customer.email,
    metadata: payload.eventData.metaData,
  };
}
