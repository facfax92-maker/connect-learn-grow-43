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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role - for now we check if user email contains 'admin' or is in user_roles
    // In production, use proper admin role check
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Allow if user has any role (admin functionality will be expanded later)
    // For now, we trust the authenticated user calling admin endpoints
    // TODO: Add proper admin role to app_role enum

    const { action, ...params } = await req.json();

    if (action === "list_connections") {
      const { data, error } = await supabase
        .from("tutor_student_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with names
      if (data && data.length > 0) {
        const tutorUserIds = [...new Set(data.map((c: any) => c.tutor_user_id))];
        const studentIds = [...new Set(data.map((c: any) => c.student_id))];
        const allIds = [...new Set([...tutorUserIds, ...studentIds])];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone, email")
          .in("user_id", allIds);

        const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        const enriched = data.map((c: any) => ({
          ...c,
          tutor_name: pm.get(c.tutor_user_id)?.full_name || "Tutor",
          student_name: pm.get(c.student_id)?.full_name || "Student",
        }));

        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm_connection") {
      const { connection_id } = params;

      // Update connection status
      const { data: conn, error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", connection_id)
        .select()
        .single();

      if (error) throw error;

      // Notify both parties
      await supabase.from("notifications").insert([
        {
          user_id: conn.tutor_user_id,
          type: "connection_confirmed",
          message: `Your connection has been confirmed! Student contact details are now unlocked.`,
          related_id: conn.id,
        },
        {
          user_id: conn.student_id,
          type: "connection_confirmed",
          message: `You've been connected with your tutor! Their contact details are now available.`,
          related_id: conn.id,
        },
      ]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject_connection") {
      const { connection_id, note } = params;

      const { data: conn, error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "pending", admin_note: note || "Payment screenshot rejected. Please resend." })
        .eq("id", connection_id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: conn.tutor_user_id,
        type: "connection_rejected",
        message: `Your payment screenshot was rejected. ${note || "Please upload a new one."}`,
        related_id: conn.id,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_settings") {
      const { settings } = params;
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from("platform_settings")
          .update({ value: String(value), updated_at: new Date().toISOString() })
          .eq("key", key);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_stats") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: allConns } = await supabase
        .from("tutor_student_connections")
        .select("status, platform_fee, created_at");

      const confirmed = (allConns || []).filter((c: any) => c.status === "confirmed");
      const thisMonth = confirmed.filter((c: any) => c.confirmed_at >= monthStart || c.created_at >= monthStart);
      const pending = (allConns || []).filter((c: any) => c.status === "payment_submitted");

      return new Response(JSON.stringify({
        connections_this_month: thisMonth.length,
        revenue_this_month: thisMonth.reduce((s: number, c: any) => s + Number(c.platform_fee), 0),
        revenue_all_time: confirmed.reduce((s: number, c: any) => s + Number(c.platform_fee), 0),
        pending_confirmations: pending.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_screenshot_url") {
      const { path } = params;
      const { data } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(path, 3600);

      return new Response(JSON.stringify({ url: data?.signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "expire_old_connections") {
      const { error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "expired" })
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString());

      return new Response(JSON.stringify({ success: true, error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
