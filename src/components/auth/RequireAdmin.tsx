import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (loading) return;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      setChecking(true);
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error || !data) {
        toast({
          title: "Access denied",
          description: "Admin privileges required.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    };

    run();
  }, [user, loading, navigate, toast]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;
  return <>{children}</>;
};

export default RequireAdmin;
