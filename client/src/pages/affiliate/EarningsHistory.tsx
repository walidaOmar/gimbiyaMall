import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import DashboardHeader from "@/components/DashboardHeader";
import { DollarSign, TrendingUp, Users, Award } from "lucide-react";

export default function EarningsHistory() {
  const { data: stats, isLoading } = trpc.affiliate.myStats.useQuery();
  const { data: linkData } = trpc.affiliate.getReferralLink.useQuery();

  const s = stats as any;
  const totalEarnings = s?.totalEarnings ?? 0;
  const totalReferrals = s?.totalReferrals ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Earnings History" subtitle="Your affiliate commission overview" /> */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">₦{totalEarnings.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-400 opacity-40" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Referrals</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{totalReferrals}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-400 opacity-40" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Avg per Referral</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        ₦{totalReferrals > 0 ? Math.round(totalEarnings / totalReferrals).toLocaleString() : 0}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-indigo-400 opacity-40" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Referral Code</p>
                      <p className="text-lg font-bold font-mono text-slate-900 mt-1">{linkData?.code ?? "—"}</p>
                    </div>
                    <Award className="w-10 h-10 text-yellow-400 opacity-40" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Earnings Breakdown</CardTitle></CardHeader>
              <CardContent>
                {totalReferrals === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No earnings yet</p>
                    <p className="text-slate-400 text-sm mt-1">Share your referral link to start earning commissions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-slate-600">Commission from referrals</span>
                      <span className="font-bold text-green-600">₦{totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-slate-600">Total referral orders</span>
                      <span className="font-semibold text-slate-900">{totalReferrals}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="font-bold text-slate-900">Total Payable</span>
                      <span className="font-bold text-green-600 text-lg">₦{totalEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Info */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-blue-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">How Commissions Are Calculated</h3>
                <p className="text-sm text-slate-600">
                  You earn a percentage commission on every order placed through your referral link.
                  Commission rates are set per product by store managers. Earnings are tallied after
                  successful delivery confirmation.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}