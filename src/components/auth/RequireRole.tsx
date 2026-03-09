import { ReactNode, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Role = "student" | "tutor";

const RequireRole = ({ role, children }: { role: Role; children: ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const redirectPath = useMemo(() => {
    if (!profile?.role) return "/signup?step=role";
    if (profile.role === "student") return "/student/dashboard";
    if (profile.role === "tutor") return "/tutor/dashboard";
    if (profile.role === "admin") return "/admin";
    return "/";
  }, [profile?.role]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (profile?.role && profile.role !== role) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, user, profile?.role, role, navigate, redirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (profile?.role !== role) return null;

  return <>{children}</>;
};

export default RequireRole;
