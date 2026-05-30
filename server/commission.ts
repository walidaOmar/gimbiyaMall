import { Decimal } from "decimal.js";

/**
 * Commission calculation logic for the e-commerce platform
 * Handles automated profit calculation and commission distribution
 */

export interface CommissionBreakdown {
  baseSalePrice: Decimal;
  commissionPercent: Decimal;
  commissionAmount: Decimal;
  finalPrice: Decimal;
  adminProfit: Decimal;
  developerCommission: Decimal;
  readerCommission: Decimal;
  deliveryCommission: Decimal;
}

/**
 * Calculate final price with commission
 * Final Price = Base Sale Price + (Base Sale Price × Commission %)
 */
export function calculateFinalPrice(
  baseSalePrice: string | number | Decimal,
  commissionPercent: string | number | Decimal
): Decimal {
  const basePrice = new Decimal(baseSalePrice);
  const commission = new Decimal(commissionPercent);
  const commissionAmount = basePrice.mul(commission).div(100);
  return basePrice.add(commissionAmount);
}

/**
 * Calculate commission breakdown for an order item
 */
export function calculateCommissionBreakdown(
  costPrice: string | number | Decimal,
  baseSalePrice: string | number | Decimal,
  commissionPercent: string | number | Decimal,
  developerCommissionPercent: string | number | Decimal = "30",
  readerCommissionPercent: string | number | Decimal = "10",
  deliveryCommissionPercent: string | number | Decimal = "5"
): CommissionBreakdown {
  const cost = new Decimal(costPrice);
  const basePrice = new Decimal(baseSalePrice);
  const commission = new Decimal(commissionPercent);
  const devCommPercent = new Decimal(developerCommissionPercent);
  const readerCommPercent = new Decimal(readerCommissionPercent);
  const deliveryCommPercent = new Decimal(deliveryCommissionPercent);

  // Calculate commission amount
  const commissionAmount = basePrice.mul(commission).div(100);

  // Calculate final price
  const finalPrice = basePrice.add(commissionAmount);

  // Calculate admin profit (base sale price - cost price)
  const adminProfit = basePrice.sub(cost);

  // Distribute commission
  const developerCommission = commissionAmount.mul(devCommPercent).div(100);
  const readerCommission = commissionAmount.mul(readerCommPercent).div(100);
  const deliveryCommission = commissionAmount.mul(deliveryCommPercent).div(100);

  return {
    baseSalePrice: basePrice,
    commissionPercent: commission,
    commissionAmount,
    finalPrice,
    adminProfit,
    developerCommission,
    readerCommission,
    deliveryCommission,
  };
}

/**
 * Calculate order totals from items
 */
export function calculateOrderTotals(items: CommissionBreakdown[]) {
  let totalAmount = new Decimal(0);
  let totalCommission = new Decimal(0);
  let totalAdminProfit = new Decimal(0);
  let totalDeveloperCommission = new Decimal(0);
  let totalReaderCommission = new Decimal(0);
  let totalDeliveryCommission = new Decimal(0);

  for (const item of items) {
    totalAmount = totalAmount.add(item.finalPrice);
    totalCommission = totalCommission.add(item.commissionAmount);
    totalAdminProfit = totalAdminProfit.add(item.adminProfit);
    totalDeveloperCommission = totalDeveloperCommission.add(item.developerCommission);
    totalReaderCommission = totalReaderCommission.add(item.readerCommission);
    totalDeliveryCommission = totalDeliveryCommission.add(item.deliveryCommission);
  }

  return {
    totalAmount,
    totalCommission,
    totalAdminProfit,
    totalDeveloperCommission,
    totalReaderCommission,
    totalDeliveryCommission,
  };
}

/**
 * Format Decimal to currency string
 */
export function formatCurrency(value: Decimal | string | number): string {
  const decimal = new Decimal(value);
  return decimal.toFixed(2);
}

/**
 * Convert Decimal to number for API responses
 */
export function toNumber(value: Decimal | string | number): number {
  return new Decimal(value).toNumber();
}
