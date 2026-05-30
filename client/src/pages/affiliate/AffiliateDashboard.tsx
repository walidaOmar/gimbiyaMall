import { trpc } from "@/lib/trpc";
// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Link2, DollarSign, Users, TrendingUp, Copy, Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.affiliate.myStats.useQuery();
  const { data: linkData } = trpc.affiliate.getReferralLink.useQuery();

  const s = stats as any;
  const totalReferrals = s?.totalReferrals ?? 0;
  const totalEarnings = s?.totalEarnings ?? 0;

  const copyLink = () => {
    navigator.clipboard.writeText(linkData?.url ?? "").then(() => toast.success("Link copied!"));
  };

  const shareLink = () => {
    if (navigator.share && linkData?.url) {
      navigator.share({ title: "Shop at Gimbiya Mall", url: linkData.url });
    } else copyLink();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Affiliate Dashboard" subtitle="Track your referrals and commissions" /> */}

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Referrals", value: isLoading ? "—" : totalReferrals, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Earnings", value: isLoading ? "—" : `₦${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
            { label: "Referral Code", value: linkData?.code ?? "—", icon: Link2, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Avg per Referral", value: isLoading ? "—" : `₦${totalReferrals > 0 ? Math.round(totalEarnings / totalReferrals).toLocaleString() : 0}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Link Card */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Link2 className="w-5 h-5" /> Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/20 rounded-xl p-3">
                <p className="font-mono text-sm break-all opacity-90">{linkData?.url ?? "Loading..."}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyLink} className="flex-1 bg-white text-blue-700 hover:bg-blue-50 gap-2">
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
                <Button onClick={shareLink} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10 gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <button onClick={() => navigate("/affiliate/referrals")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Link2 className="w-5 h-5 text-blue-600" /></div>
                  <div className="text-left"><p className="font-semibold text-slate-900 text-sm">Manage Referrals</p><p className="text-xs text-slate-500">View and share your links</p></div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => navigate("/affiliate/earnings")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
                  <div className="text-left"><p className="font-semibold text-slate-900 text-sm">Earnings History</p><p className="text-xs text-slate-500">Track your commissions</p></div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total referral orders</span>
                  <span className="font-semibold">{totalReferrals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Commission earned</span>
                  <span className="font-semibold text-green-600">₦{totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}