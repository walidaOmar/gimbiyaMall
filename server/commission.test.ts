import { describe, it, expect } from "vitest";
import { calculateFinalPrice, calculateCommissionBreakdown, calculateOrderTotals, formatCurrency, toNumber } from "./commission";
import Decimal from "decimal.js";

describe("Commission Calculations", () => {
  describe("calculateFinalPrice", () => {
    it("should calculate final price with commission", () => {
      const basePrice = "100";
      const commission = "10";
      const result = calculateFinalPrice(basePrice, commission);
      expect(result.toString()).toBe("110");
    });

    it("should handle decimal inputs", () => {
      const basePrice = "99.99";
      const commission = "15";
      const result = calculateFinalPrice(basePrice, commission);
      expect(result.toString()).toBe("114.9885");
    });

    it("should handle zero commission", () => {
      const basePrice = "100";
      const commission = "0";
      const result = calculateFinalPrice(basePrice, commission);
      expect(result.toString()).toBe("100");
    });
  });

  describe("calculateCommissionBreakdown", () => {
    it("should calculate complete commission breakdown", () => {
      const breakdown = calculateCommissionBreakdown("50", "100", "10");
      
      expect(breakdown.baseSalePrice.toString()).toBe("100");
      expect(breakdown.commissionPercent.toString()).toBe("10");
      expect(breakdown.commissionAmount.toString()).toBe("10");
      expect(breakdown.finalPrice.toString()).toBe("110");
      expect(breakdown.adminProfit.toString()).toBe("50");
    });

    it("should distribute commission to developer, reader, and delivery", () => {
      const breakdown = calculateCommissionBreakdown(
        "50",
        "100",
        "10",
        "30", // developer 30%
        "10", // reader 10%
        "5"   // delivery 5%
      );

      const commission = new Decimal("10");
      expect(breakdown.developerCommission.toString()).toBe(commission.mul(30).div(100).toString());
      expect(breakdown.readerCommission.toString()).toBe(commission.mul(10).div(100).toString());
      expect(breakdown.deliveryCommission.toString()).toBe(commission.mul(5).div(100).toString());
    });

    it("should handle high commission percentages", () => {
      const breakdown = calculateCommissionBreakdown("50", "100", "50");
      expect(breakdown.finalPrice.toString()).toBe("150");
      expect(breakdown.commissionAmount.toString()).toBe("50");
    });
  });

  describe("calculateOrderTotals", () => {
    it("should sum up multiple items correctly", () => {
      const items = [
        calculateCommissionBreakdown("50", "100", "10"),
        calculateCommissionBreakdown("30", "80", "15"),
      ];

      const totals = calculateOrderTotals(items);
      
      expect(totals.totalAmount.toString()).toBe("202");
      expect(totals.totalCommission.toString()).toBe("22");
      expect(totals.totalAdminProfit.toString()).toBe("100");
    });

    it("should handle empty items array", () => {
      const totals = calculateOrderTotals([]);
      
      expect(totals.totalAmount.toString()).toBe("0");
      expect(totals.totalCommission.toString()).toBe("0");
      expect(totals.totalAdminProfit.toString()).toBe("0");
    });
  });

  describe("formatCurrency", () => {
    it("should format decimal to 2 decimal places", () => {
      expect(formatCurrency(new Decimal("100.5"))).toBe("100.50");
      expect(formatCurrency("99.999")).toBe("100.00");
      expect(formatCurrency(50)).toBe("50.00");
    });
  });

  describe("toNumber", () => {
    it("should convert decimal to number", () => {
      expect(toNumber(new Decimal("100.5"))).toBe(100.5);
      expect(toNumber("99.99")).toBe(99.99);
      expect(toNumber(50)).toBe(50);
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle a typical e-commerce transaction", () => {
      // Product: Cost ₦5,000, Sale ₦7,000, Commission 10%
      const breakdown = calculateCommissionBreakdown("5000", "7000", "10");
      
      expect(breakdown.finalPrice.toString()).toBe("7700");
      expect(breakdown.adminProfit.toString()).toBe("2000");
      expect(breakdown.commissionAmount.toString()).toBe("700");
      
      // Commission distribution
      const devComm = breakdown.developerCommission.toNumber();
      const readerComm = breakdown.readerCommission.toNumber();
      const deliveryComm = breakdown.deliveryCommission.toNumber();
      
      expect(devComm).toBe(210); // 30% of 700
      expect(readerComm).toBe(70);  // 10% of 700
      expect(deliveryComm).toBe(35); // 5% of 700
    });

    it("should handle bulk order with multiple items", () => {
      const items = [
        calculateCommissionBreakdown("5000", "7000", "10"),
        calculateCommissionBreakdown("3000", "4500", "10"),
        calculateCommissionBreakdown("2000", "3000", "10"),
      ];

      const totals = calculateOrderTotals(items);
      
      // Total final prices: 7700 + 4950 + 3300 = 15950
      expect(totals.totalAmount.toString()).toBe("15950");
      
      // Total admin profit: 2000 + 1500 + 1000 = 4500
      expect(totals.totalAdminProfit.toString()).toBe("4500");
      
      // Total commission: 700 + 450 + 300 = 1450
      expect(totals.totalCommission.toString()).toBe("1450");
    });
  });
});
