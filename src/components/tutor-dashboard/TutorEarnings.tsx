import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = { tutorProfile: any };

const TutorEarnings = ({ tutorProfile }: Props) => {
  const { toast } = useToast();
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    fetchEarnings();
  }, [tutorProfile]);

  const fetchEarnings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("tutor_id", tutorProfile.id)
      .eq("status", "completed")
      .order("date", { ascending: false });

    if (!data || data.length === 0) {
      setCompletedSessions([]);
      setTotalEarned(0);
      return;
    }

    // Enrich with student names
    const sids = [...new Set(data.map((b: any) => b.student_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", sids);
    const pm = new Map(profiles?.map((p: any) => [p.user_id, p.full_name]) || []);

    const enriched = data.map((b: any) => ({
      ...b,
      student_name: pm.get(b.student_id) || "Student",
      earned: b.price || 0,
    }));

    setCompletedSessions(enriched);
    setTotalEarned(enriched.reduce((s: number, b: any) => s + b.earned, 0));
  };

  const exportCsv = () => {
    const now = new Date();
    const header = "Date,Student,Subject,Duration,Earned\n";
    const rows = completedSessions
      .map(
        (s) =>
          `"${format(new Date(s.date), "yyyy-MM-dd")}","${s.student_name}","${s.subject}",${s.duration},${s.earned}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-foreground">Earnings</h2>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={completedSessions.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: `रू ${totalEarned.toLocaleString()}`, icon: Wallet },
          { label: "Sessions", value: completedSessions.length, icon: Clock },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Payouts</p>
            <p className="text-sm text-muted-foreground mt-1">
              Payouts are handled manually (eSewa/Khalti). If you need a payout, contact support.
            </p>
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={() => toast({ title: "Payout request received", description: "Support will contact you to arrange eSewa/Khalti payout." })}
          >
            Request Payout
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {completedSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No completed sessions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{format(new Date(s.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm font-medium">{s.student_name}</TableCell>
                    <TableCell className="text-sm">{s.subject}</TableCell>
                    <TableCell className="text-sm text-right">{s.duration}min</TableCell>
                    <TableCell className="text-sm text-right font-bold">रू {s.earned.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right">
                      <Badge variant="secondary" className="capitalize">completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorEarnings;
