import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, Mail, Lock, Chrome } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Role = "student" | "tutor";

type Step = "credentials" | "check_email" | "role";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("step") === "role") setStep("role");
  }, [searchParams]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // If email confirmation is enabled, session may be null until the user confirms.
    if (!data.session) {
      setStep("check_email");
      return;
    }

    setStep("role");
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/signup?step=role",
    });
    if (result.error) {
      toast({
        title: "Google signup failed",
        description: String(result.error),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const ensureProfileRow = async (uid: string) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();

    if (existing) return;

    const { data: authUser } = await supabase.auth.getUser();

    await supabase.from("profiles").insert({
      user_id: uid,
      email: authUser.user?.email ?? null,
      full_name: (authUser.user?.user_metadata as any)?.full_name ?? null,
      avatar_url: (authUser.user?.user_metadata as any)?.avatar_url ?? null,
      role: null,
    });
  };

  const ensureUserRole = async (uid: string, role: Role) => {
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", uid)
      .eq("role", role)
      .maybeSingle();

    if (existing) return;

    await supabase.from("user_roles").insert({ user_id: uid, role });
  };

  const handleRoleSelect = async (role: Role) => {
    setLoading(true);

    const uid = user?.id;
    if (!uid) {
      toast({
        title: "Confirm your email",
        description: "Please confirm your email, then log in to continue setup.",
        variant: "destructive",
      });
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      await ensureProfileRow(uid);
      await supabase.from("profiles").update({ role }).eq("user_id", uid);
      await ensureUserRole(uid, role);
      await refreshProfile();

      navigate(role === "student" ? "/onboarding/student" : "/onboarding/tutor");
    } catch (err: any) {
      toast({
        title: "Setup failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "check_email") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <a href="/" className="font-display text-2xl font-bold text-secondary">
              Tutor<span className="text-primary">Connect</span>
            </a>
            <CardTitle className="mt-4 font-display text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <span className="font-medium">{email}</span>. Confirm it, then log in to
              finish setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setStep("credentials")}>Sign up with a different email</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "role") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <a href="/" className="font-display text-2xl font-bold text-secondary">
              Tutor<span className="text-primary">Connect</span>
            </a>
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">How will you use TutorConnect?</h1>
            <p className="mt-2 text-muted-foreground">Choose your role to get started</p>
          </div>

          {!user && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                You’re not logged in yet—please confirm your email and log in, then come back to choose your role.
                <div className="mt-4">
                  <Link to="/login">
                    <Button className="w-full">Go to Login</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleRoleSelect("student")}
              disabled={loading || !user}
              className="group relative flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">I'm a Student</h3>
              <p className="text-sm text-muted-foreground text-center">I want to find tutors and learn new subjects</p>
            </button>

            <button
              onClick={() => handleRoleSelect("tutor")}
              disabled={loading || !user}
              className="group relative flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">I'm a Tutor</h3>
              <p className="text-sm text-muted-foreground text-center">I want to offer lessons and teach students</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <a href="/" className="font-display text-2xl font-bold text-secondary">
            Tutor<span className="text-primary">Connect</span>
          </a>
          <CardTitle className="mt-4 font-display text-2xl">Create your account</CardTitle>
          <CardDescription>Get started with TutorConnect today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
