import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Link2,
  Wallet,
  Star,
  Settings,
} from "lucide-react";
import AdminDashboardTab from "@/components/admin/AdminDashboardTab";
import AdminTutorsTab from "@/components/admin/AdminTutorsTab";
import AdminStudentsTab from "@/components/admin/AdminStudentsTab";
import AdminConnectionsTab from "@/components/admin/AdminConnectionsTab";
import AdminPaymentsTab from "@/components/admin/AdminPaymentsTab";
import AdminReviewsTab from "@/components/admin/AdminReviewsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tutors", label: "Tutors", icon: Users },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminPanel = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      if (!data) {
        toast({ title: "Access Denied", description: "Admin privileges required.", variant: "destructive" });
        navigate("/");
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    };
    checkAdmin();
  }, [user, authLoading]);

  const invokeAdmin = useCallback(async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-panel", {
      body: { action, ...params },
    });
    if (error) throw error;
    return data;
  }, []);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] p-4 gap-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin Panel</p>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Mobile nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[4rem] flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {activeTab === "dashboard" && <AdminDashboardTab invokeAdmin={invokeAdmin} />}
          {activeTab === "tutors" && <AdminTutorsTab invokeAdmin={invokeAdmin} />}
          {activeTab === "students" && <AdminStudentsTab invokeAdmin={invokeAdmin} />}
          {activeTab === "connections" && <AdminConnectionsTab invokeAdmin={invokeAdmin} />}
          {activeTab === "payments" && <AdminPaymentsTab invokeAdmin={invokeAdmin} />}
          {activeTab === "reviews" && <AdminReviewsTab invokeAdmin={invokeAdmin} />}
          {activeTab === "settings" && <AdminSettingsTab invokeAdmin={invokeAdmin} />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
