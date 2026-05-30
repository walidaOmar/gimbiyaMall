/**
 * server/pricing.test.ts
 *
 * Tests for the single-source-of-truth pricing module.
 * Run with: pnpm test
 */

import { describe, it, expect } from "vitest";
import {
  calcFinalPrice,
  calcTransactionFee,
  calcCommissionSplit,
  calcCommissionAmount,
  calcOrderTotals,
  TRANSACTION_FEE_RATE,
  SPLIT_WITH_REFERRER,
  SPLIT_NO_REFERRER,
} from "./pricing";

// ─── calcFinalPrice ───────────────────────────────────────────────────────────
describe("calcFinalPrice", () => {
  it("adds commission % on top of base sale price", () => {
    expect(calcFinalPrice(1000, 10)).toBe(1100);
  });

  it("handles 0% commission (price unchanged)", () => {
    expect(calcFinalPrice(5000, 0)).toBe(5000);
  });

  it("rounds to 2 decimal places", () => {
    // 99.99 * 1.15 = 114.9885 → 114.99
    expect(calcFinalPrice(99.99, 15)).toBe(114.99);
  });

  it("handles fractional commission", () => {
    expect(calcFinalPrice(200, 7.5)).toBe(215);
  });

  it("handles large amounts correctly", () => {
    expect(calcFinalPrice(100000, 10)).toBe(110000);
  });
});

// ─── calcTransactionFee ───────────────────────────────────────────────────────
describe("calcTransactionFee", () => {
  it("charges 1.5% of order amount", () => {
    expect(calcTransactionFee(10000)).toBe(150);
  });

  it("returns 0 for 0 amount", () => {
    expect(calcTransactionFee(0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 999.99 * 0.015 = 14.99985 → 15.00
    expect(calcTransactionFee(999.99)).toBe(15);
  });

  it("reflects the correct global rate constant", () => {
    expect(TRANSACTION_FEE_RATE).toBe(0.015);
  });

  it("scales linearly", () => {
    const base = calcTransactionFee(1000);
    expect(calcTransactionFee(5000)).toBeCloseTo(base * 5, 5);
  });
});

// ─── calcCommissionAmount ─────────────────────────────────────────────────────
describe("calcCommissionAmount", () => {
  it("calculates commission per unit times quantity", () => {
    // finalPrice 1100, baseSalePrice 1000, qty 2 → (100) * 2 = 200
    expect(calcCommissionAmount(1100, 1000, 2)).toBe(200);
  });

  it("returns 0 when finalPrice equals baseSalePrice", () => {
    expect(calcCommissionAmount(500, 500, 10)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // (99.99 - 88.88) * 3 = 11.11 * 3 = 33.33
    expect(calcCommissionAmount(99.99, 88.88, 3)).toBe(33.33);
  });
});

// ─── calcCommissionSplit (with referrer) ──────────────────────────────────────
describe("calcCommissionSplit — with referrer", () => {
  const commission = 1000;
  const split = calcCommissionSplit(commission, true);

  it("reader gets 50%", () => {
    expect(split.readerCommission).toBe(500);
  });

  it("developer gets 20%", () => {
    expect(split.developerCommission).toBe(200);
  });

  it("admin gets 20%", () => {
    expect(split.adminProfit).toBe(200);
  });

  it("delivery gets 10%", () => {
    expect(split.deliveryCommission).toBe(100);
  });

  it("split percentages add up to 100%", () => {
    const total =
      SPLIT_WITH_REFERRER.reader +
      SPLIT_WITH_REFERRER.developer +
      SPLIT_WITH_REFERRER.admin +
      SPLIT_WITH_REFERRER.delivery;
    expect(total).toBeCloseTo(1, 10);
  });
});

// ─── calcCommissionSplit (without referrer) ───────────────────────────────────
describe("calcCommissionSplit — no referrer", () => {
  const commission = 1000;
  const split = calcCommissionSplit(commission, false);

  it("reader gets nothing", () => {
    expect(split.readerCommission).toBe(0);
  });

  it("developer gets 30%", () => {
    expect(split.developerCommission).toBe(300);
  });

  it("admin gets 60%", () => {
    expect(split.adminProfit).toBe(600);
  });

  it("delivery gets 10%", () => {
    expect(split.deliveryCommission).toBe(100);
  });

  it("split percentages add up to 100%", () => {
    const total =
      SPLIT_NO_REFERRER.developer +
      SPLIT_NO_REFERRER.admin +
      SPLIT_NO_REFERRER.delivery;
    expect(total).toBeCloseTo(1, 10);
  });
});

// ─── calcOrderTotals ──────────────────────────────────────────────────────────
describe("calcOrderTotals", () => {
  it("sums subtotals, commission, and transaction fee for one item", () => {
    const items = [{ finalPrice: 1100, baseSalePrice: 1000, quantity: 1 }];
    const totals = calcOrderTotals(items);

    expect(totals.subtotal).toBe(1100);
    expect(totals.commissionTotal).toBe(100); // 1100 - 1000
    expect(totals.transactionFee).toBe(16.5); // 1100 * 0.015
    expect(totals.totalAmount).toBe(1100);    // buyer pays subtotal
  });

  it("handles multiple items correctly", () => {
    const items = [
      { finalPrice: 1100, baseSalePrice: 1000, quantity: 2 }, // subtotal 2200, comm 200
      { finalPrice: 550,  baseSalePrice: 500,  quantity: 3 }, // subtotal 1650, comm 150
    ];
    const totals = calcOrderTotals(items);

    expect(totals.subtotal).toBe(3850);
    expect(totals.commissionTotal).toBe(350);
    expect(totals.transactionFee).toBeCloseTo(57.75, 2); // 3850 * 0.015
    expect(totals.totalAmount).toBe(3850);
  });

  it("handles empty cart — all zeroes", () => {
    const totals = calcOrderTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.commissionTotal).toBe(0);
    expect(totals.transactionFee).toBe(0);
    expect(totals.totalAmount).toBe(0);
  });

  it("handles zero-commission product (price = baseSalePrice)", () => {
    const items = [{ finalPrice: 500, baseSalePrice: 500, quantity: 4 }];
    const totals = calcOrderTotals(items);

    expect(totals.subtotal).toBe(2000);
    expect(totals.commissionTotal).toBe(0);
    expect(totals.transactionFee).toBe(30); // 2000 * 0.015
  });

  it("real-world Nigerian order scenario", () => {
    // 3 items: Indomie carton ₦3850, Peak Milk ₦8250, Dettol ₦1980
    const items = [
      { finalPrice: 3850,  baseSalePrice: 3500,  quantity: 1 }, // comm 350
      { finalPrice: 8250,  baseSalePrice: 7500,  quantity: 2 }, // comm 750 each = 1500
      { finalPrice: 1980,  baseSalePrice: 1800,  quantity: 3 }, // comm 180 each = 540
    ];
    const totals = calcOrderTotals(items);

    // subtotals: 3850 + 16500 + 5940 = 26290
    expect(totals.subtotal).toBe(26290);
    // commission: 350 + 1500 + 540 = 2390
    expect(totals.commissionTotal).toBe(2390);
    // fee: 26290 * 0.015 = 394.35
    expect(totals.transactionFee).toBeCloseTo(394.35, 2);
  });
});

// ─── Constants sanity checks ──────────────────────────────────────────────────
describe("pricing constants", () => {
  it("transaction fee is exactly 1.5%", () => {
    expect(TRANSACTION_FEE_RATE).toBe(0.015);
  });

  it("with-referrer splits are all positive fractions summing to 1", () => {
    const values = Object.values(SPLIT_WITH_REFERRER);
    expect(values.every((v) => v > 0 && v < 1)).toBe(true);
    expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("no-referrer splits sum to 1", () => {
    const values = Object.values(SPLIT_NO_REFERRER);
    expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("reader commission is 0 in no-referrer scenario", () => {
    expect(SPLIT_NO_REFERRER).not.toHaveProperty("reader");
  });
});
