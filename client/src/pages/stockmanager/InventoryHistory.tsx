import { useState } from "react";
// import DashboardHeader from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";

const MOCK_HISTORY = [
  { _id: "1", name: "Indomie Noodles (Carton)",   stockQuantity: 4,  soldQuantity: 320, updatedAt: new Date(Date.now() - 1800000).toISOString(),  categoryId: { name: "Food" } },
  { _id: "2", name: "Golden Penny Semolina 1kg",   stockQuantity: 88, soldQuantity: 45,  updatedAt: new Date(Date.now() - 3600000).toISOString(),  categoryId: { name: "Food" } },
  { _id: "3", name: "Dettol Soap (12-pack)",       stockQuantity: 2,  soldQuantity: 180, updatedAt: new Date(Date.now() - 7200000).toISOString(),  categoryId: { name: "Health" } },
  { _id: "4", name: "Peak Milk (48-pack)",          stockQuantity: 0,  soldQuantity: 95,  updatedAt: new Date(Date.now() - 10800000).toISOString(), categoryId: { name: "Dairy" } },
  { _id: "5", name: "Dangote Sugar 1kg",            stockQuantity: 120,soldQuantity: 55,  updatedAt: new Date(Date.now() - 18000000).toISOString(), categoryId: { name: "Food" } },
  { _id: "6", name: "Sunlight Detergent 1kg",      stockQuantity: 9,  soldQuantity: 210, updatedAt: new Date(Date.now() - 21600000).toISOString(), categoryId: { name: "Household" } },
  { _id: "7", name: "Bic Ballpoint Pens (Pack)",   stockQuantity: 45, soldQuantity: 88,  updatedAt: new Date(Date.now() - 28800000).toISOString(), categoryId: { name: "Stationery" } },
  { _id: "8", name: "Close-Up Toothpaste 100g",    stockQuantity: 34, soldQuantity: 67,  updatedAt: new Date(Date.now() - 36000000).toISOString(), categoryId: { name: "Health" } },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60)   return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function InventoryHistory() {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);
  const PAGE_SIZE = 20;

  const query = trpc.inventory?.recentActivity?.useQuery(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    { retry: false }
  );
  const items = query?.data ?? MOCK_HISTORY;

  const filtered = items.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getStockStatus(qty: number) {
    if (qty === 0)  return { label: "Out of Stock", color: "#B71C1C", bg: "#FFEBEE" };
    if (qty <= 10)  return { label: "Low Stock",    color: "#E65100", bg: "#FFF3E0" };
    if (qty <= 50)  return { label: "Moderate",     color: "#0D47A1", bg: "#E3F2FD" };
    return               { label: "In Stock",       color: "#1B5E20", bg: "#E8F5E9" };
  }

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#f8f6f0", minHeight: "100vh" }}>
      {/* <DashboardHeader title="Inventory History" subtitle="Recent product stock activity" role="stock_manager" /> */}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <Input
            placeholder="Search product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, background: "white", border: "1px solid #e2ddd4", borderRadius: 10 }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2ddd4", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2ddd4", background: "#1A1A2E", display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={16} color="#C8A84B" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B" }}>
              Recent Inventory Activity
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f6f0" }}>
                {["Product", "Category", "Current Stock", "Sold", "Status", "Last Updated"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any, i: number) => {
                const status = getStockStatus(p.stockQuantity);
                return (
                  <tr key={p._id} style={{ borderTop: "1px solid #f1ede6", background: i % 2 === 0 ? "white" : "#fdfaf6" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{p.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{(p.categoryId as any)?.name ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {p.stockQuantity === 0
                          ? <TrendingDown size={14} color="#B71C1C" />
                          : p.stockQuantity <= 10
                          ? <TrendingDown size={14} color="#E65100" />
                          : <TrendingUp size={14} color="#1B5E20" />}
                        <span style={{ fontSize: 14, fontWeight: 700, color: status.color }}>{p.stockQuantity}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                      {p.soldQuantity ?? 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        background: status.bg, color: status.color,
                      }}>{status.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                      {timeAgo(p.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #f1ede6" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length} products
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ fontSize: 12 }}>← Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={items.length < PAGE_SIZE}
                style={{ fontSize: 12 }}>Next →</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
