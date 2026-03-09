import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am - 9pm

type Props = { tutorProfile: any };
type Slot = { id: string; day_of_week: number; start_time: string; end_time: string };
type BlockedDate = { id?: string; date: string };

const TutorAvailability = ({ tutorProfile }: Props) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedToggle, setSelectedToggle] = useState<{ day: number; hour: number } | null>(null);

  useEffect(() => {
    fetchSlots();
  }, [tutorProfile]);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", tutorProfile.id)
      .order("day_of_week")
      .order("start_time");
    setSlots((data as Slot[]) || []);
  };

  // Check if a specific hour on a day is covered by a slot
  const isSlotActive = (day: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    return slots.some(
      (s) =>
        s.day_of_week === day &&
        s.start_time <= timeStr &&
        s.end_time > timeStr
    );
  };

  const toggleSlot = async (day: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    const nextHour = `${(hour + 1).toString().padStart(2, "0")}:00`;

    if (isSlotActive(day, hour)) {
      // Find and delete/shrink the slot containing this hour
      const slot = slots.find(
        (s) => s.day_of_week === day && s.start_time <= timeStr && s.end_time > timeStr
      );
      if (slot) {
        await supabase.from("tutor_availability").delete().eq("id", slot.id);
        // Re-create parts if slot was bigger
        const startH = parseInt(slot.start_time.split(":")[0]);
        const endH = parseInt(slot.end_time.split(":")[0]);
        if (startH < hour) {
          await supabase.from("tutor_availability").insert({
            tutor_id: tutorProfile.id,
            day_of_week: day,
            start_time: slot.start_time,
            end_time: timeStr,
          });
        }
        if (endH > hour + 1) {
          await supabase.from("tutor_availability").insert({
            tutor_id: tutorProfile.id,
            day_of_week: day,
            start_time: nextHour,
            end_time: slot.end_time,
          });
        }
      }
    } else {
      // Add a 1-hour slot
      await supabase.from("tutor_availability").insert({
        tutor_id: tutorProfile.id,
        day_of_week: day,
        start_time: timeStr,
        end_time: nextHour,
      });
    }
    fetchSlots();
  };

  // Quick set recurring: set a full range for a day
  const [recurDay, setRecurDay] = useState(1);
  const [recurStart, setRecurStart] = useState("09");
  const [recurEnd, setRecurEnd] = useState("17");

  const addRecurring = async () => {
    const start = parseInt(recurStart);
    const end = parseInt(recurEnd);
    if (start >= end) {
      toast({ title: "Start must be before end", variant: "destructive" });
      return;
    }
    // Delete existing slots for this day
    const existing = slots.filter((s) => s.day_of_week === recurDay);
    for (const s of existing) {
      await supabase.from("tutor_availability").delete().eq("id", s.id);
    }
    // Insert single big slot
    await supabase.from("tutor_availability").insert({
      tutor_id: tutorProfile.id,
      day_of_week: recurDay,
      start_time: `${recurStart.padStart(2, "0")}:00`,
      end_time: `${recurEnd.padStart(2, "0")}:00`,
    });
    toast({ title: "Recurring availability set!" });
    fetchSlots();
  };

  const fmtHour = (h: number) => `${h % 12 || 12}${h >= 12 ? "p" : "a"}`;

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">Manage Availability</h2>

      {/* Weekly grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          <p className="text-xs text-muted-foreground">Click cells to toggle available (green) / unavailable</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
              <div />
              {DAY_NAMES.map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            {/* Time rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div className="text-xs text-muted-foreground text-right pr-2 py-1">
                  {fmtHour(hour)}
                </div>
                {Array.from({ length: 7 }, (_, day) => {
                  const active = isSlotActive(day, hour);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleSlot(day, hour)}
                      className={`h-8 rounded transition-colors ${
                        active
                          ? "bg-primary/80 hover:bg-primary/60"
                          : "bg-muted hover:bg-muted-foreground/10"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick recurring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set Recurring Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Day</label>
              <select
                value={recurDay}
                onChange={(e) => setRecurDay(parseInt(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start</label>
              <select
                value={recurStart}
                onChange={(e) => setRecurStart(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h.toString()}>{fmtHour(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End</label>
              <select
                value={recurEnd}
                onChange={(e) => setRecurEnd(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {HOURS.map((h) => (
                  <option key={h + 1} value={(h + 1).toString()}>{fmtHour(h + 1)}</option>
                ))}
              </select>
            </div>
            <Button onClick={addRecurring} className="gap-1">
              <Plus className="h-4 w-4" /> Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current slots summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No availability set yet.</p>
          ) : (
            <div className="space-y-2">
              {slots.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{DAY_NAMES[s.day_of_week]}</span>
                    <span className="text-muted-foreground ml-2">
                      {fmtHour(parseInt(s.start_time))} – {fmtHour(parseInt(s.end_time))}
                    </span>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await supabase.from("tutor_availability").delete().eq("id", s.id);
                      fetchSlots();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorAvailability;
