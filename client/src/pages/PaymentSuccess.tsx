import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Download, Home } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PaymentSuccess() {
  const [search] = useSearch();
  const [, navigate] = useLocation();
  const orderId = new URLSearchParams(search).get("orderId");

  const { data: order, isLoading } = trpc.orders.detail.useQuery(
    { orderId: orderId ?? "" },
    { enabled: !!orderId }
  );

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading receipt...</div>;
  if (!order) return <div className="text-center py-12">Order not found</div>;

  const orderData = order as any;

  const downloadReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("RECEIPT", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Order #: ${orderData.orderId ?? orderData._id}`, 20, 40);
    doc.text(`Date: ${new Date(orderData.createdAt).toLocaleString()}`, 20, 50);
    doc.text(`Customer: ${orderData.buyerId?.name ?? "Buyer"}`, 20, 60);
    doc.text(`Email: ${orderData.buyerId?.email ?? "-"}`, 20, 70);
    doc.text(`Shipping: ${orderData.shippingAddress}, ${orderData.shippingCity}`, 20, 80);

    autoTable(doc, {
      startY: 100,
      head: [["Product", "Qty", "Price", "Total"]],
      body: (orderData.items || []).map((item: any) => [
        item.name,
        item.quantity,
        `₦${item.finalPrice.toFixed(2)}`,
        `₦${(item.finalPrice * item.quantity).toFixed(2)}`,
      ]),
      foot: [["", "", "Total", `₦${orderData.finalAmount.toFixed(2)}`]],
    });
    doc.save(`receipt_${orderData.orderId ?? orderData._id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-700">Payment Successful!</h1>
          <p className="text-slate-600 mt-2">Thank you for your purchase.</p>

          <Separator className="my-6" />

          <div className="text-left bg-slate-50 p-4 rounded-lg">
            <h2 className="font-semibold">Order Details</h2>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Order ID:</span> {orderData.orderId ?? orderData._id}</p>
              <p><span className="font-medium">Date:</span> {new Date(orderData.createdAt).toLocaleString()}</p>
              <p><span className="font-medium">Email:</span> {orderData.buyerId?.email ?? "-"}</p>
              <p><span className="font-medium">Shipping:</span> {orderData.shippingAddress}, {orderData.shippingCity}</p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              {(orderData.items || []).map((item: any) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₦{(item.finalPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Paid</span>
                <span>₦{orderData.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 justify-center flex-wrap">
            <Button variant="outline" onClick={downloadReceipt}>
              <Download className="w-4 h-4 mr-2" /> Download PDF Receipt
            </Button>
            <Button onClick={() => navigate("/mall")}>
              <Home className="w-4 h-4 mr-2" /> Back to Plaza
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
