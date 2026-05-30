/**
 * server/pricing.ts — Single source of truth for all platform fee calculations.
 *
 * ALL fee logic lives here. Import from this module everywhere.
 * Never duplicate these calculations in routers or other files.
 *
 * Revenue layers implemented:
 *   Layer 1  — Merchant subscription (handled separately via billing)
 *   Layer 2  — Transaction fee (1.5% of order GMV)
 *   Layer 3  — Payment revenue share (handled by Monnify agreement)
 *   Layer 5  — Affiliate (reader) commission per conversion
 *   Internal — Commission split between platform parties
 */

// ─── Layer 2: Transaction Fee ─────────────────────────────────────────────────

/** Platform transaction fee rate: 1.5% */
export const TRANSACTION_FEE_RATE = 0.015;

/**
 * Calculate the platform transaction fee on a given order amount.
 * Applied to every paid order at checkout.
 */
export function calcTransactionFee(orderAmount: number): number {
  return parseFloat((orderAmount * TRANSACTION_FEE_RATE).toFixed(2));
}

// ─── Product Pricing ──────────────────────────────────────────────────────────

/**
 * Calculate the final customer-facing price from base sale price + commission %.
 * Commission % is the affiliate/referral margin baked into the price.
 */
export function calcFinalPrice(baseSalePrice: number, commissionPercent: number): number {
  return parseFloat((baseSalePrice * (1 + commissionPercent / 100)).toFixed(2));
}

// ─── Commission Split ─────────────────────────────────────────────────────────

/**
 * Commission split percentages (of the total commission amount).
 *
 *  With referrer:
 *    - Reader (affiliate):  50%
 *    - Developer:           20%
 *    - Admin (merchant):    20%
 *    - Delivery:            10%
 *
 *  Without referrer (no affiliate link used):
 *    - Developer:           30%
 *    - Admin (merchant):    60%
 *    - Delivery:            10%
 */
export const SPLIT_WITH_REFERRER = {
  reader:    0.50,
  developer: 0.20,
  admin:     0.20,
  delivery:  0.10,
};

export const SPLIT_NO_REFERRER = {
  developer: 0.30,
  admin:     0.60,
  delivery:  0.10,
};

export interface CommissionSplit {
  readerCommission:    number;
  developerCommission: number;
  adminProfit:         number;
  deliveryCommission:  number;
}

/**
 * Split a commission amount between platform parties.
 * @param commissionAmount - Total commission to split (from finalPrice - baseSalePrice)
 * @param hasReferrer      - Whether the order came through an affiliate referral link
 */
export function calcCommissionSplit(
  commissionAmount: number,
  hasReferrer: boolean
): CommissionSplit {
  const round = (n: number) => parseFloat(n.toFixed(2));

  if (hasReferrer) {
    return {
      readerCommission:    round(commissionAmount * SPLIT_WITH_REFERRER.reader),
      developerCommission: round(commissionAmount * SPLIT_WITH_REFERRER.developer),
      adminProfit:         round(commissionAmount * SPLIT_WITH_REFERRER.admin),
      deliveryCommission:  round(commissionAmount * SPLIT_WITH_REFERRER.delivery),
    };
  }

  return {
    readerCommission:    0,
    developerCommission: round(commissionAmount * SPLIT_NO_REFERRER.developer),
    adminProfit:         round(commissionAmount * SPLIT_NO_REFERRER.admin),
    deliveryCommission:  round(commissionAmount * SPLIT_NO_REFERRER.delivery),
  };
}

/**
 * Calculate commission amount from a product's final price and base sale price.
 */
export function calcCommissionAmount(
  finalPrice: number,
  baseSalePrice: number,
  quantity: number
): number {
  return parseFloat(((finalPrice - baseSalePrice) * quantity).toFixed(2));
}

// ─── Order Total ──────────────────────────────────────────────────────────────

export interface OrderTotals {
  subtotal:       number; // sum of (finalPrice × qty) for all items
  transactionFee: number; // Layer 2 platform fee
  totalAmount:    number; // subtotal (what buyer pays — fee absorbed by platform)
  commissionTotal:number; // total commission embedded in subtotal
}

/**
 * Calculate all totals for an order given its line items.
 */
export function calcOrderTotals(
  items: Array<{ finalPrice: number; baseSalePrice: number; quantity: number }>
): OrderTotals {
  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);
  const commissionTotal = items.reduce(
    (sum, i) => sum + calcCommissionAmount(i.finalPrice, i.baseSalePrice, i.quantity),
    0
  );
  const transactionFee = calcTransactionFee(subtotal);

  return {
    subtotal:        parseFloat(subtotal.toFixed(2)),
    transactionFee:  transactionFee,
    totalAmount:     parseFloat(subtotal.toFixed(2)), // buyer pays subtotal; fee is platform's cut of commission
    commissionTotal: parseFloat(commissionTotal.toFixed(2)),
  };
}
