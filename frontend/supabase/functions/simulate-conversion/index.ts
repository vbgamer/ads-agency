import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://id-preview--718f5ef9-26b1-4391-a4f2-638f1f1b7eb4.lovable.app",
  Deno.env.get("SITE_URL") ?? "",
  "http://localhost:8080",
  "http://localhost:8081",
]

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  }
}

interface RequestBody {
  tracking_id: string;
  conversion_type?: "app_install" | "purchase" | "signup";
  event_value?: number;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Get auth token from request
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Validate user
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);

  if (claimsError || !claimsData.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.user.id;

  // Check if user is admin
  const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Use service role for the actual operation
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: RequestBody = await req.json();

    if (!body.tracking_id) {
      return new Response(
        JSON.stringify({ error: "tracking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process the simulated conversion
    const { data: result, error: rpcError } = await supabase.rpc("process_conversion", {
      p_tracking_id: body.tracking_id,
      p_conversion_type: body.conversion_type || "app_install",
      p_conversion_data: {
        source: "manual_simulation",
        simulated_by: userId,
        event_value: body.event_value,
        timestamp: new Date().toISOString(),
      },
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result?.success) {
      return new Response(
        JSON.stringify({ error: result?.error || "Simulation failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the simulation
    await supabase.from("webhook_logs").insert({
      source: "manual_simulation",
      endpoint: "/simulate-conversion",
      payload: body,
      headers: { simulated_by: userId },
      signature_valid: true,
      processed: true,
      tracking_id: body.tracking_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conversion simulated successfully",
        transaction_id: result.transaction_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
