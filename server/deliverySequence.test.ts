import { describe, expect, it } from "vitest";
import {
  calculateDistanceDeliveryFee,
  canCancelOrder,
  isUnpaidOrderExpired,
  pickTopRider,
  validateDeliveryTransition,
} from "./deliverySequence";

describe("delivery sequence policy", () => {
  it("requires approval to cancel processing orders", () => {
    expect(canCancelOrder("processing", false)).toBe(false);
    expect(canCancelOrder("processing", true)).toBe(true);
  });

  it("enforces payment timeout at 1000s", () => {
    const created = new Date("2026-04-25T00:00:00.000Z");
    const now = new Date("2026-04-25T00:16:41.000Z"); // 1001 seconds
    expect(isUnpaidOrderExpired(created, now)).toBe(true);
  });

  it("requires OTP and photo for delivered transitions", () => {
    const missing = validateDeliveryTransition("in_transit", "delivered", {
      otpVerified: false,
      photoUrl: "",
    });
    expect(missing.ok).toBe(false);

    const valid = validateDeliveryTransition("in_transit", "delivered", {
      otpVerified: true,
      photoUrl: "https://example.com/proof.jpg",
    });
    expect(valid.ok).toBe(true);
  });

  it("calculates distance-based delivery fee", () => {
    expect(calculateDistanceDeliveryFee(2.5, 100)).toBe(250);
  });

  it("picks top responsive and fast rider", () => {
    const selected = pickTopRider([
      { riderId: "r1", responseScore: 91, avgDeliveryMinutes: 31, completedDeliveries: 22 },
      { riderId: "r2", responseScore: 91, avgDeliveryMinutes: 27, completedDeliveries: 20 },
      { riderId: "r3", responseScore: 85, avgDeliveryMinutes: 24, completedDeliveries: 80 },
    ]);

    expect(selected?.riderId).toBe("r2");
  });
});
