/**
 * Production operating policy captured from stakeholder decisions (April 2026).
 * This file is the source of truth for feature flags and policy toggles
 * while moving from demo to production.
 */

export const PRODUCTION_POLICY = {
  checkout: {
    payBeforeProcessingOnly: true,
    deliveryFeeMode: "distance_gps" as const,
    splitCartPerStore: true,
    processingCancellationRequiresApproval: true,
  },
  payment: {
    monnifyMode: "test_pilot" as const,
    allowPartialPayment: true,
    unpaidOrderTimeoutSeconds: 1000,
    paymentFailureAlertRole: "developer" as const,
  },
  delivery: {
    assignmentMode: "auto_and_manual" as const,
    assignmentAuthority: ["developer", "admin"] as const,
    autoAssignPriority: ["top_responsive", "fast_delivery"] as const,
    proofOfDelivery: {
      otpRequired: true,
      photoRequired: true,
      allowDeliveryWithoutOtp: false,
    },
    failedAttemptChargePolicy: "direct_costs" as const,
  },
  commission: {
    withdrawableOn: "delivery_confirmation" as const,
    disbursementMode: "manual_approval_first" as const,
    refundPolicy: "prorate_by_fulfilment_stage" as const,
    minimumAffiliateWithdrawalEnabled: true,
  },
  governance: {
    kycRequirements: [
      "NIN",
      "Residential address",
      "BVN",
      "Emergency contact",
      "CAC registration",
      "Utility bill",
    ] as const,
    requiredAuditArtifacts: ["webhook_logs", "payout_receipts"] as const,
    commissionOverrideAuthority: "developer_and_super_admin" as const,
    vatTaxInvoiceRequired: true,
  },
} as const;

export type ProductionPolicy = typeof PRODUCTION_POLICY;
