import { PRODUCTION_POLICY } from "./productionConfig";
import type { OrderStatus } from "./models/Order";

export type DeliveryTransition = "assigned" | "in_transit" | "delivered";

export interface DeliveryProof {
  otpCode?: string;
  otpVerified?: boolean;
  photoUrl?: string;
}

export interface RiderPerformance {
  riderId: string;
  responseScore: number; // higher is better
  avgDeliveryMinutes: number; // lower is better
  completedDeliveries: number; // higher is better
}

export function isUnpaidOrderExpired(createdAt: Date, now = new Date()): boolean {
  const elapsedSeconds = (now.getTime() - createdAt.getTime()) / 1000;
  return elapsedSeconds > PRODUCTION_POLICY.payment.unpaidOrderTimeoutSeconds;
}

export function canCancelOrder(status: OrderStatus, hasSpecialApproval = false): boolean {
  if (status === "processing") return hasSpecialApproval;
  return ["pending", "paid"].includes(status);
}

export function calculateDistanceDeliveryFee(distanceKm: number, ratePerKm = 120): number {
  if (distanceKm <= 0) return 0;
  return parseFloat((distanceKm * ratePerKm).toFixed(2));
}

export function validateDeliveryTransition(
  currentStatus: OrderStatus,
  nextStatus: DeliveryTransition,
  proof: DeliveryProof = {}
): { ok: boolean; reason?: string } {
  const validTransitions: Record<OrderStatus, DeliveryTransition[]> = {
    pending: [],
    paid: ["assigned"],
    processing: ["assigned"],
    assigned: ["in_transit"],
    in_transit: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    return { ok: false, reason: `Invalid transition from ${currentStatus} to ${nextStatus}` };
  }

  if (nextStatus === "delivered") {
    if (PRODUCTION_POLICY.delivery.proofOfDelivery.otpRequired && !proof.otpVerified) {
      return { ok: false, reason: "OTP verification is required before delivery confirmation" };
    }
    if (PRODUCTION_POLICY.delivery.proofOfDelivery.photoRequired && !proof.photoUrl) {
      return { ok: false, reason: "Photo proof is required before delivery confirmation" };
    }
  }

  return { ok: true };
}

export function pickTopRider(candidates: RiderPerformance[]): RiderPerformance | null {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    if (b.responseScore !== a.responseScore) return b.responseScore - a.responseScore;
    if (a.avgDeliveryMinutes !== b.avgDeliveryMinutes) return a.avgDeliveryMinutes - b.avgDeliveryMinutes;
    return b.completedDeliveries - a.completedDeliveries;
  })[0];
}
