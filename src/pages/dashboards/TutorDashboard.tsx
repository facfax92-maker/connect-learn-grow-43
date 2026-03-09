import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  DollarSign,
  Star,
  User,
  MessageCircle,
  Settings,
} from "lucide-react";
import TutorOverview from "@/components/tutor-dashboard/TutorOverview";
import TutorBookings from "@/components/tutor-dashboard/TutorBookings";
import TutorAvailability from "@/components/tutor-dashboard/TutorAvailability";
import TutorEarnings from "@/components/tutor-dashboard/TutorEarnings";
import TutorReviews from "@/components/tutor-dashboard/TutorReviews";
import TutorProfileTab from "@/components/tutor-dashboard/TutorProfileTab";
import TutorSettings from "@/components/tutor-dashboard/TutorSettings";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "earnings", label: "Earnings", icon: DollarSign },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "profile", label: "Profile", icon: User },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

const TutorDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [tutorProfile, setTutorProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tutor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setTutorProfile(data);
      });
  }, [user]);

  // Realtime: listen for new booking requests
  useEffect(() => {
    if (!tutorProfile) return;
    const channel = supabase
      .channel("tutor-bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `tutor_id=eq.${tutorProfile.id}`,
        },
        (payload) => {
          toast({
            title: "📩 New Booking Request!",
            description: `A student wants to book a ${payload.new.subject} session.`,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tutorProfile, toast]);

  useEffect(() => {
    if (activeTab === "messages") navigate("/messages");
  }, [activeTab, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] p-4 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background">
          <div className="flex overflow-x-auto">
            {TABS.slice(0, 6).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-[60px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {activeTab === "overview" && (
            <TutorOverview
              user={user}
              profile={profile}
              tutorProfile={tutorProfile}
            />
          )}
          {activeTab === "bookings" && tutorProfile && (
            <TutorBookings tutorProfile={tutorProfile} />
          )}
          {activeTab === "availability" && tutorProfile && (
            <TutorAvailability tutorProfile={tutorProfile} />
          )}
          {activeTab === "earnings" && tutorProfile && (
            <TutorEarnings tutorProfile={tutorProfile} />
          )}
          {activeTab === "reviews" && tutorProfile && (
            <TutorReviews tutorProfile={tutorProfile} />
          )}
          {activeTab === "profile" && tutorProfile && (
            <TutorProfileTab
              user={user}
              profile={profile}
              tutorProfile={tutorProfile}
              setTutorProfile={setTutorProfile}
              refreshProfile={refreshProfile}
            />
          )}
          {activeTab === "settings" && (
            <TutorSettings />
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorDashboard;
