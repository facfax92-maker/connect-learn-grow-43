import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, Wallet } from "lucide-react";
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

const PLATFORM_FEE_PERCENT = 10; // 10% platform commission on sessions

const TutorEarnings = ({ tutorProfile }: Props) => {
  const { toast } = useToast();
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [totalGross, setTotalGross] = useState(0);
  const [totalNet, setTotalNet] = useState(0);

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

    if (data && data.length > 0) {
      // Enrich with student names
      const sids = [...new Set(data.map((b: any) => b.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", sids);
      const pm = new Map(profiles?.map((p: any) => [p.user_id, p.full_name]) || []);

      const enriched = data.map((b: any) => {
        const gross = b.price || 0;
        const fee = Math.round(gross * PLATFORM_FEE_PERCENT / 100);
        return {
          ...b,
          student_name: pm.get(b.student_id) || "Student",
          gross,
          fee,
          net: gross - fee,
        };
      });

      setCompletedSessions(enriched);
      setTotalGross(enriched.reduce((s: number, b: any) => s + b.gross, 0));
      setTotalNet(enriched.reduce((s: number, b: any) => s + b.net, 0));
    }
  };

  const pendingPayout = totalNet; // simplified: all net is pending

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">Earnings</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Gross", value: `रू ${totalGross.toLocaleString()}`, icon: DollarSign },
          { label: "Platform Fees", value: `रू ${(totalGross - totalNet).toLocaleString()}`, icon: TrendingUp },
          { label: "Net Earnings", value: `रू ${totalNet.toLocaleString()}`, icon: Wallet },
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

      {/* Payout */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available for Payout</p>
            <p className="text-3xl font-bold text-foreground">रू {pendingPayout.toLocaleString()}</p>
          </div>
          <Button
            size="lg"
            disabled={pendingPayout === 0}
            onClick={() => toast({ title: "Payout requested", description: "You'll receive your earnings within 3-5 business days." })}
          >
            Request Payout
          </Button>
        </CardContent>
      </Card>

      {/* Sessions table */}
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
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{format(new Date(s.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm font-medium">{s.student_name}</TableCell>
                    <TableCell className="text-sm">{s.subject}</TableCell>
                    <TableCell className="text-sm text-right">{s.duration}min</TableCell>
                    <TableCell className="text-sm text-right">रू {s.gross.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right text-destructive">-रू {s.fee.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right font-bold">रू {s.net.toLocaleString()}</TableCell>
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
