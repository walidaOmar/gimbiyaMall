import { router, publicProcedure } from "./_core/trpc";
import { buyerProcedure } from "./rbac";
import { z } from "zod";
import { initiateMonnifyPayment, getMonnifyTransactionDetails } from "./monnify";
import { getOrderByOrderId } from "./db";
import { Order } from "./models/Order";
import { nanoid } from "nanoid";

export const paymentRouter = router({
  /**
   * Initiate a payment for an order
   */
  initiatePayment: buyerProcedure
    .input(z.object({
      orderId: z.string(),
      redirectUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get order details
      const order = await getOrderByOrderId(input.orderId);
      if (!order) throw new Error("Order not found");

      const buyerId = (order as any).buyerId?._id || (order as any).buyerId;
      if (buyerId.toString() !== (ctx.user as any)._id.toString()) {
        throw new Error("Unauthorized: Order does not belong to this user");
      }

      // Generate transaction reference
      const transactionRef = `TXN-${nanoid(12)}`;

      try {
        // Initiate payment with Monnify
        const paymentResponse = await initiateMonnifyPayment({
          amount: parseFloat(order.finalAmount.toString()),
          customerName: ctx.user.name || "Customer",
          customerEmail: ctx.user.email || "",
          paymentReference: order.orderId,
          paymentDescription: `Payment for Order ${order.orderId}`,
          currencyCode: "NGN",
          contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
          redirectUrl: input.redirectUrl,
          metadata: {
            orderId: (order as any)._id.toString(),
            userId: (ctx.user as any)._id.toString(),
            transactionReference: transactionRef,
          },
        });

        if (!paymentResponse.requestSuccessful) {
          throw new Error(paymentResponse.responseMessage);
        }

        // Update order with payment status and reference
        await Order.findOneAndUpdate(
          { orderId: order.orderId },
          {
            paymentStatus: "pending",
            paymentReference: transactionRef
          }
        );

        return {
          success: true,
          transactionReference: transactionRef,
          paymentLink: paymentResponse.responseBody?.checkoutUrl,
          accessToken: paymentResponse.responseBody?.accessToken,
        };
      } catch (error: any) {
        console.error("[Payment] Initiation failed:", error);
        throw new Error(`Payment initiation failed: ${error.message}`);
      }
    }),

  /**
   * Verify payment status
   */
  verifyPayment: buyerProcedure
    .input(z.object({
      transactionReference: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const paymentDetails = await getMonnifyTransactionDetails(input.transactionReference);

        if (!paymentDetails) {
          throw new Error("Payment details not found");
        }

        // Update order payment status based on verification
        if (paymentDetails.paymentStatus === "PAID") {
          await Order.findOneAndUpdate(
            { paymentReference: input.transactionReference },
            {
              paymentStatus: "paid",
              status: "paid",
            }
          );
        }

        return {
          success: true,
          status: paymentDetails.paymentStatus,
          amount: paymentDetails.amountPaid,
          transactionReference: paymentDetails.transactionReference,
          paidOn: paymentDetails.paidOn,
        };
      } catch (error: any) {
        console.error("[Payment] Verification failed:", error);
        throw new Error(`Payment verification failed: ${error.message}`);
      }
    }),

  /**
   * Get payment history for a buyer
   */
  getPaymentHistory: buyerProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const result = await Order.find({ buyerId: (ctx.user as any)._id })
        .sort({ createdAt: -1 })
        .limit(input.limit)
        .skip(input.offset)
        .lean();

      return result.map(order => ({
        orderId: order.orderId,
        amount: order.finalAmount,
        status: order.paymentStatus,
        createdAt: order.createdAt,
        items: (order as any)._id.toString(),
      }));
    }),

  /**
   * Get order payment details
   */
  getOrderPayment: publicProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .query(async ({ input }) => {
      const order = await getOrderByOrderId(input.orderId);
      if (!order) return null;

      return {
        orderId: order.orderId,
        amount: order.finalAmount,
        status: order.paymentStatus,
        createdAt: order.createdAt,
      };
    }),
});
