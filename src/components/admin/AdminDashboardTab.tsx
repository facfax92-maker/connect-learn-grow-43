import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, GraduationCap, Link2, TrendingUp, Clock, Star } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

type Stats = {
  total_tutors: number;
  total_students: number;
  active_connections_month: number;
  revenue_month: number;
  pending_confirmations: number;
  avg_rating: number;
  revenue_all_time: number;
  pending_tutors: number;
  flagged_reviews: number;
};

const AdminDashboardTab = ({ invokeAdmin }: Props) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await invokeAdmin("get_dashboard_stats");
        setStats(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!stats) return <p className="text-muted-foreground text-center py-12">Failed to load stats</p>;

  const statCards = [
    { label: "Total Tutors", value: stats.total_tutors, icon: Users },
    { label: "Total Students", value: stats.total_students, icon: GraduationCap },
    { label: "Connections (Month)", value: stats.active_connections_month, icon: Link2 },
    { label: "Revenue (Month)", value: `रू ${stats.revenue_month.toLocaleString()}`, icon: TrendingUp },
    { label: "Pending Payments", value: stats.pending_confirmations, icon: Clock, highlight: stats.pending_confirmations > 0 },
    { label: "Avg Rating", value: stats.avg_rating.toFixed(1), icon: Star },
  ];

  // Mock chart data (would be derived from real connection data in production)
  const weekData = Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    connections: Math.floor(Math.random() * 10) + 1,
  }));
  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    revenue: Math.floor(Math.random() * 3000) + 500,
  }));

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className={s.highlight ? "border-destructive" : ""}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.highlight ? "bg-destructive/10" : "bg-accent"}`}>
                <s.icon className={`h-5 w-5 ${s.highlight ? "text-destructive" : "text-accent-foreground"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Connections Per Week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="connections" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Revenue Trend (30 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Activity Summary</h3>
          <div className="space-y-2">
            {stats.pending_tutors > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{stats.pending_tutors}</Badge>
                <span className="text-muted-foreground">tutor(s) awaiting approval</span>
              </div>
            )}
            {stats.pending_confirmations > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="destructive">{stats.pending_confirmations}</Badge>
                <span className="text-muted-foreground">payment screenshot(s) to review</span>
              </div>
            )}
            {stats.flagged_reviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{stats.flagged_reviews}</Badge>
                <span className="text-muted-foreground">flagged review(s) pending moderation</span>
              </div>
            )}
            {stats.pending_tutors === 0 && stats.pending_confirmations === 0 && stats.flagged_reviews === 0 && (
              <p className="text-sm text-muted-foreground">No pending actions. Everything looks good! ✅</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardTab;
