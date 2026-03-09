import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // Expire pending connections past their expires_at
    const { data: expired, error } = await supabase
      .from("tutor_student_connections")
      .update({ status: "expired" })
      .in("status", ["pending", "payment_submitted"])
      .lt("expires_at", now)
      .select("id, tutor_user_id, student_id");

    if (error) throw error;

    // Notify affected users
    if (expired && expired.length > 0) {
      const notifications = expired.flatMap((conn: any) => [
        {
          user_id: conn.tutor_user_id,
          type: "connection_expired",
          message: "A pending connection has expired after 48 hours.",
          related_id: conn.id,
        },
        {
          user_id: conn.student_id,
          type: "connection_expired",
          message: "A pending connection has expired after 48 hours.",
          related_id: conn.id,
        },
      ]);
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, expired_count: expired?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
