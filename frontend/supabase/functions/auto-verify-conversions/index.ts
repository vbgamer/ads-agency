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

interface PendingTransaction {
  id: string;
  user_id: string;
  amount: number;
  campaign_id: string;
  hold_until: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify this is called with admin authorization or is a scheduled call
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      
      if (user) {
        const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        isAuthorized = isAdmin === true;
      }
    }
    
    // Also allow calls with service role key (for scheduled jobs)
    const apiKey = req.headers.get("apikey");
    if (apiKey === supabaseServiceKey) {
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse optional parameters
    let batchSize = 100;
    let dryRun = false;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        batchSize = body.batch_size || 100;
        dryRun = body.dry_run === true;
      } catch {
        // Use defaults
      }
    }

    // Find transactions that have passed their hold period
    const { data: pendingTx, error: fetchError } = await supabase
      .from("cashback_transactions")
      .select("id, user_id, amount, campaign_id, hold_until")
      .eq("verification_status", "pending")
      .lt("hold_until", new Date().toISOString())
      .limit(batchSize);

    if (fetchError) {
      console.error("Error fetching pending transactions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pending transactions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactions = pendingTx as PendingTransaction[] || [];
    
    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No transactions to auto-verify",
          verified_count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Dry run completed",
          would_verify_count: transactions.length,
          transactions: transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            hold_until: tx.hold_until,
          })),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each transaction
    const results = {
      verified: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const tx of transactions) {
      try {
        // Use the updated verify_conversion function with auto_verified flag
        const { data: result, error: verifyError } = await supabase.rpc("verify_conversion", {
          p_transaction_id: tx.id,
          p_action: "verify",
          p_reason: null,
          p_auto_verified: true,
        });

        if (verifyError || !result?.success) {
          results.failed++;
          results.errors.push(`TX ${tx.id}: ${verifyError?.message || result?.error || "Unknown error"}`);
        } else {
          results.verified++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`TX ${tx.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Log the auto-verification run
    await supabase.from("webhook_logs").insert({
      source: "auto-verify-system",
      endpoint: "/auto-verify-conversions",
      payload: {
        batch_size: batchSize,
        processed: transactions.length,
        verified: results.verified,
        failed: results.failed,
      },
      headers: {},
      signature_valid: true,
      processed: results.failed === 0,
      error_message: results.errors.length > 0 ? results.errors.join("; ") : null,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Auto-verification completed`,
        verified_count: results.verified,
        failed_count: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
