import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  user_id: string;
  role: "student" | "tutor" | "admin" | null;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (u: User) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      return;
    }

    // Create a minimal profile row so the app can safely reference it.
    await supabase.from("profiles").insert({
      user_id: u.id,
      full_name: (u.user_metadata as any)?.full_name ?? null,
      avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
      email: u.email ?? null,
      role: null,
    });

    const { data: created } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();

    setProfile((created as Profile) ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchOrCreateProfile(user);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await fetchOrCreateProfile(nextSession.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchOrCreateProfile(session.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
