import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Download,
  CalendarPlus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type BookingLocationState = {
  tutorName?: string;
  tutorAvatar?: string | null;
  hourlyRate?: number;
  subjects?: string[];
  sessionType?: string;
  selectedDate?: string;
  selectedTime?: string;
};

type AvailabilitySlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const STEP_LABELS = ["Session Details", "Date & Time", "Add Note", "Confirm"];

const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const startHour = parseInt(startTime.split(":")[0], 10);
  const endHour = parseInt(endTime.split(":")[0], 10);
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return slots;
};

const formatTime = (time: string): string => {
  const hour = parseInt(time.split(":")[0], 10);
  const min = time.split(":")[1] || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min} ${ampm}`;
};

const BookingFlow = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const state = (location.state as BookingLocationState) || {};

  const [step, setStep] = useState(1);
  const [sessionType, setSessionType] = useState<string>(
    state.sessionType === "both" ? "online" : state.sessionType || "online"
  );
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState(state.subjects?.[0] || "");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    state.selectedDate ? new Date(state.selectedDate + "T00:00:00") : undefined
  );
  const [selectedTime, setSelectedTime] = useState(state.selectedTime || "");

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [dayTimeSlots, setDayTimeSlots] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Fetch tutor availability
  useEffect(() => {
    if (!tutorId) return;
    supabase
      .from("tutor_availability")
      .select("day_of_week, start_time, end_time")
      .eq("tutor_id", tutorId)
      .then(({ data }) => {
        if (data) setAvailability(data as AvailabilitySlot[]);
      });
  }, [tutorId]);

  // Compute slots when date changes
  useEffect(() => {
    if (!selectedDate || !tutorId) return;

    const dow = selectedDate.getDay();
    const dayAvail = availability.filter((a) => a.day_of_week === dow);
    const slots = new Set<string>();
    dayAvail.forEach((a) =>
      generateTimeSlots(a.start_time, a.end_time).forEach((s) => slots.add(s))
    );
    setDayTimeSlots(Array.from(slots).sort());
    setSelectedTime("");

    // Fetch booked slots for this date
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    supabase
      .from("bookings")
      .select("start_time")
      .eq("tutor_id", tutorId)
      .eq("date", dateStr)
      .in("status", ["confirmed", "pending_payment"])
      .then(({ data }) => {
        if (data) setBookedTimes(data.map((b) => b.start_time.substring(0, 5)));
      });
  }, [selectedDate, availability, tutorId]);

  const price = state.hourlyRate ? (state.hourlyRate * duration) / 60 : 0;

  const handleConfirm = async () => {
    if (!user || !tutorId || !selectedDate || !selectedTime || !subject) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        student_id: user.id,
        tutor_id: tutorId,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        duration,
        subject,
        note: note || null,
        status: "confirmed",
        price,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setBookingId(data.id);
      setBookingSuccess(true);
    }
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedDate || !selectedTime) return "#";
    const startDt = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`);
    const endDt = addMinutes(startDt, duration);
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    return (
      `https://calendar.google.com/calendar/r/eventedit` +
      `?text=${encodeURIComponent(`Tutoring Session – ${subject}`)}` +
      `&dates=${fmt(startDt)}/${fmt(endDt)}` +
      `&details=${encodeURIComponent(`Session with ${state.tutorName || "tutor"}`)}`
    );
  };

  const downloadICS = () => {
    if (!selectedDate || !selectedTime) return;
    const startDt = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`);
    const endDt = addMinutes(startDt, duration);
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `UID:${bookingId}`,
      `DTSTART:${fmt(startDt)}`,
      `DTEND:${fmt(endDt)}`,
      `SUMMARY:Tutoring Session – ${subject}`,
      `DESCRIPTION:Session with ${state.tutorName || "tutor"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tutoring-session.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tutorInitials = (state.tutorName || "T")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Success state ──
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-accent">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Session Booked! 🎉
                </h1>
                <p className="text-muted-foreground mt-2">Your session has been confirmed.</p>
              </div>

              {/* Summary */}
              <div className="text-left space-y-2 p-4 rounded-lg bg-muted/40 text-sm">
                {[
                  ["Tutor", state.tutorName || "—"],
                  ["Subject", subject],
                  ["Session Type", sessionType === "online" ? "Online" : "In-Person"],
                  [
                    "Date",
                    selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "—",
                  ],
                  ["Time", selectedTime ? formatTime(selectedTime) : "—"],
                  [
                    "Duration",
                    DURATIONS.find((d) => d.value === duration)?.label || "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">रू {price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Add to Google Calendar
                  </Button>
                </a>
                <Button variant="outline" className="gap-2" onClick={downloadICS}>
                  <Download className="h-4 w-4" />
                  Download .ics
                </Button>
                <Button onClick={() => navigate("/student/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ── Step progress bar ──
  const StepBar = () => (
    <div className="mb-8">
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "bg-background border-primary text-primary"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : num}
              </div>
              <span
                className={`text-xs hidden sm:block text-center max-w-[70px] leading-tight ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Tutor mini header ──
  const TutorHeader = () => (
    <Card className="mb-6">
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={state.tutorAvatar || undefined} />
          <AvatarFallback className="bg-accent text-accent-foreground font-bold">
            {tutorInitials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{state.tutorName || "Your Tutor"}</p>
          <p className="text-sm text-muted-foreground">रू {state.hourlyRate?.toLocaleString()}/session</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <StepBar />
        <TutorHeader />

        {/* ── Step 1: Session Details ── */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Session Details</h2>

              {/* Session type (only if tutor offers both) */}
              {state.sessionType === "both" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Session Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["online", "in_person"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSessionType(t)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          sessionType === t
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {t === "online" ? "🌐 Online" : "📍 In-Person"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`py-2 px-1 rounded-lg border-2 text-sm font-medium transition-all ${
                        duration === d.value
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(state.subjects || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price preview */}
               <div className="p-4 rounded-lg bg-accent flex items-center justify-between">
                <span className="text-sm text-accent-foreground">
                  {DURATIONS.find((d) => d.value === duration)?.label} × रू {state.hourlyRate?.toLocaleString()}/session
                </span>
                <span className="text-2xl font-bold text-foreground">रू {price.toLocaleString()}</span>
              </div>

              <Button className="w-full" disabled={!subject} onClick={() => setStep(2)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Date & Time ── */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Choose Date & Time</h2>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                  }}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  className="rounded-lg border border-border"
                />
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Available times for {format(selectedDate, "EEEE, MMM d")}
                  </p>
                  {dayTimeSlots.length === 0 ? (
                    <div className="text-muted-foreground text-sm text-center py-6 border border-dashed border-border rounded-lg">
                      No available slots for this day. Try another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {dayTimeSlots.map((time) => {
                        const booked = bookedTimes.includes(time);
                        const selected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => setSelectedTime(selected ? "" : time)}
                            className={`py-2 px-1 text-sm rounded-lg border-2 font-medium transition-all ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : booked
                                ? "border-border bg-muted text-muted-foreground cursor-not-allowed line-through"
                                : "border-border text-foreground hover:border-primary"
                            }`}
                          >
                            {formatTime(time)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Note ── */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Add a Note</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  What would you like to focus on? (optional)
                </p>
              </div>

              <div className="space-y-1">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="e.g., I need help with calculus derivatives and integration by parts..."
                  className="min-h-[140px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Review & Confirm ── */}
        {step === 4 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Review & Confirm</h2>

              <div className="space-y-3 p-4 rounded-lg border border-border">
                {[
                  ["Tutor", state.tutorName || "—"],
                  ["Subject", subject],
                  ["Session Type", sessionType === "online" ? "Online" : "In-Person"],
                  ["Duration", DURATIONS.find((d) => d.value === duration)?.label || "—"],
                  [
                    "Date",
                    selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "—",
                  ],
                  ["Time", selectedTime ? formatTime(selectedTime) : "—"],
                  ["Note", note || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${price.toFixed(2)}</span>
                </div>
              </div>

              {/* Policy reminder */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm mb-1">Cancellation Policy</p>
                <p>✅ Free cancellation 24+ hours before session</p>
                <p>⚠️ 50% refund within 24 hours of session</p>
                <p>❌ No refund after session starts</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Confirming…" : "Confirm Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BookingFlow;
