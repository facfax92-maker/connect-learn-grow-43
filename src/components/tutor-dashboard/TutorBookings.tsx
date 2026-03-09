import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Check, X, MessageCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

type Props = { tutorProfile: any };

const TutorBookings = ({ tutorProfile }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, [tutorProfile]);

  const fetchAll = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const [{ data: p }, { data: u }, { data: h }] = await Promise.all([
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
        .eq("status", "confirmed")
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .in("status", ["completed", "cancelled"])
        .order("date", { ascending: false })
        .limit(50),
    ]);
    setPending(await enrichWithStudents(p || []));
    setUpcoming(await enrichWithStudents(u || []));
    setPast(await enrichWithStudents(h || []));
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

  const markComplete = async (id: string) => {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
    toast({ title: "Session marked complete!" });
    fetchAll();
  };

  const BookingCard = ({ b, actions }: { b: any; actions: React.ReactNode }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <Avatar className="h-10 w-10">
          <AvatarImage src={b.student_avatar || undefined} />
          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
            {(b.student_name || "S")[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{b.student_name}</p>
          <p className="text-xs text-muted-foreground">
            {b.subject} · {format(new Date(b.date), "MMM d, yyyy")} · {fmtTime(b.start_time)} · {b.duration}min
          </p>
        </div>
        <span className="text-sm font-bold text-foreground">रू {b.price?.toLocaleString()}</span>
        <div className="flex gap-2">{actions}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-xl font-bold mb-4 text-foreground">Bookings</h2>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No pending requests.</p>
            </CardContent></Card>
          ) : (
            pending.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                actions={
                  <>
                    <Button size="sm" className="gap-1" onClick={() => handleAccept(b.id)}>
                      <Check className="h-3 w-3" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDecline(b.id)}>
                      <X className="h-3 w-3" /> Decline
                    </Button>
                  </>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcoming.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming sessions.</p>
            </CardContent></Card>
          ) : (
            upcoming.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                actions={
                  <>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/messages")}>
                      <MessageCircle className="h-3 w-3" /> Message
                    </Button>
                    <Button size="sm" className="gap-1" onClick={() => markComplete(b.id)}>
                      <CheckCircle className="h-3 w-3" /> Complete
                    </Button>
                  </>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 mt-4">
          {past.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No past sessions yet.</p>
            </CardContent></Card>
          ) : (
            past.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                actions={
                  <Badge variant={b.status === "completed" ? "default" : "secondary"} className="capitalize">
                    {b.status}
                  </Badge>
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorBookings;
