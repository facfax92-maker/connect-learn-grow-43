import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Wallet, Star, Check, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmtTime = (t: string) => {
  const h = parseInt(t.split(":")[0], 10);
  return `${h % 12 || 12}:${t.split(":")[1] || "00"} ${h >= 12 ? "PM" : "AM"}`;
};

const enrichWithStudents = async (rows: any[]) => {
  if (!rows.length) return [];
  const sids = [...new Set(rows.map((r) => r.student_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .in("user_id", sids);
  const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);
  return rows.map((r) => ({
    ...r,
    student_name: pm.get(r.student_id)?.full_name || "Student",
    student_avatar: pm.get(r.student_id)?.avatar_url,
  }));
};

type Props = {
  user: any;
  profile: any;
  tutorProfile: any;
};

const TutorOverview = ({ profile, tutorProfile }: Props) => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ earnings: 0, upcoming: 0, students: 0 });
  const [earningsChart, setEarningsChart] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    if (!tutorProfile) return;
    fetchAll();
  }, [tutorProfile]);

  const fetchAll = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [
      { data: upcoming },
      { data: completed },
      { data: pendingBookings },
      { data: todayBookings },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .in("status", ["confirmed"])
        .gte("date", today),
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .eq("status", "completed")
        .gte("date", thirtyDaysAgo),
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .eq("status", "pending_payment")
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .in("status", ["confirmed", "pending_payment"])
        .eq("date", today)
        .order("start_time", { ascending: true }),
    ]);

    const allCompleted = completed || [];
    const allUpcoming = upcoming || [];
    const studentSet = new Set([
      ...allCompleted.map((b) => b.student_id),
      ...allUpcoming.map((b) => b.student_id),
    ]);

    setStats({
      earnings: allCompleted.reduce((s, b) => s + (b.price || 0), 0),
      upcoming: allUpcoming.length,
      students: studentSet.size,
    });

    // Build 30-day chart
    const dayMap = new Map<string, number>();
    for (let i = 30; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      dayMap.set(d, 0);
    }
    allCompleted.forEach((b) => {
      const d = b.date;
      dayMap.set(d, (dayMap.get(d) || 0) + (b.price || 0));
    });
    setEarningsChart(
      Array.from(dayMap.entries()).map(([date, amount]) => ({
        date: format(new Date(date + "T00:00:00"), "MMM d"),
        amount,
      }))
    );

    setTodaySessions(await enrichWithStudents(todayBookings || []));
    setPending(await enrichWithStudents(pendingBookings || []));
  };

  const handleAccept = async (id: string) => {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    toast({ title: "Booking accepted!" });
    fetchAll();
  };

  const handleDecline = async (id: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    toast({ title: "Booking declined" });
    fetchAll();
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {profile?.full_name || "Tutor"}!
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {tutorProfile?.status === "approved"
            ? "Your profile is live — students can find and book you."
            : "Your profile is pending approval."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Earnings (30d)", value: `रू ${stats.earnings.toLocaleString()}`, icon: Wallet },
          { label: "Upcoming", value: stats.upcoming, icon: Calendar },
          { label: "Students", value: stats.students, icon: Users },
          { label: "Rating", value: tutorProfile?.rating?.toFixed(1) || "—", icon: Star },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsChart}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={6}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`रू ${value}`, "Earnings"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Today's schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No sessions today.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-center w-16 text-center">
                    <span className="text-sm font-mono font-medium text-foreground">{fmtTime(s.start_time)}</span>
                  </div>
                  <div className="w-0.5 h-10 bg-primary rounded-full" />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={s.student_avatar || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {(s.student_name || "S")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.student_name}</p>
                    <p className="text-xs text-muted-foreground">{s.subject} · {s.duration}min</p>
                  </div>
                  <Badge variant={s.status === "confirmed" ? "default" : "secondary"} className="capitalize">
                    {s.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending booking requests */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Requests ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border flex-wrap">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={b.student_avatar || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {(b.student_name || "S")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{b.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.subject} · {format(new Date(b.date), "MMM d")} at {fmtTime(b.start_time)} · रू {b.price?.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => handleAccept(b.id)}>
                    <Check className="h-3 w-3" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDecline(b.id)}>
                    <X className="h-3 w-3" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorOverview;
