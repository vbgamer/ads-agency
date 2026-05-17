import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0"

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-source, x-webhook-signature",
    "Vary": "Origin",
  }
}

// HMAC signature verification
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${expectedHex}`;
    return expected === signature;
  } catch {
    return false;
  }
}

function getWebhookSecret(source: string): string | null {
  const secretMap: Record<string, string> = {
    appsflyer: "WEBHOOK_SECRET_APPSFLYER",
    adjust: "WEBHOOK_SECRET_ADJUST",
    branch: "WEBHOOK_SECRET_BRANCH",
    impact: "WEBHOOK_SECRET_IMPACT",
  };
  const envName = secretMap[source.toLowerCase()];
  if (!envName) return null;
  return Deno.env.get(envName) || null;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const url = new URL(req.url)
    const source = req.headers.get("x-webhook-source") || "unknown"
    const signature = req.headers.get("x-webhook-signature") || ""
    const campaignIdFromUrl = url.searchParams.get("campaign_id")
    
    const rawBody = await req.text()

    // Verify webhook signature for known sources
    const secret = getWebhookSecret(source)
    if (secret) {
      const valid = await verifySignature(rawBody, signature, secret)
      if (!valid) {
        await supabase.from("webhook_logs").insert({
          source,
          endpoint: "/conversion-webhook",
          payload: {},
          headers: { source },
          signature_valid: false,
          processed: false,
          error_message: "Invalid webhook signature",
        })
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    } else if (source === "unknown") {
      // Reject requests with no identified source
      await supabase.from("webhook_logs").insert({
        source,
        endpoint: "/conversion-webhook",
        payload: {},
        headers: { source },
        signature_valid: false,
        processed: false,
        error_message: "Missing x-webhook-source header",
      })
      return new Response(
        JSON.stringify({ error: "Missing x-webhook-source header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    let rawPayload: Record<string, unknown>
    try {
      rawPayload = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const campaignId = campaignIdFromUrl || (rawPayload.campaign_id as string)
    const trackingId = (rawPayload.tracking_id || rawPayload.ref || rawPayload.click_id) as string
    const eventType = (rawPayload.event_type as string) || "purchase"
    
    if (!trackingId) {
      await supabase.from("webhook_logs").insert({
        source,
        endpoint: "/conversion-webhook",
        payload: rawPayload,
        headers: { source },
        signature_valid: !!secret,
        processed: false,
        error_message: "Missing tracking_id",
      })
      return new Response(
        JSON.stringify({ error: "Missing tracking_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Process the conversion
    const { data: result, error: rpcError } = await supabase.rpc("process_conversion", {
      p_tracking_id: trackingId,
      p_conversion_type: eventType,
      p_conversion_data: {
        source,
        event_value: rawPayload.event_value,
        event_currency: rawPayload.event_currency || "INR",
        timestamp: new Date().toISOString(),
        campaign_id: campaignId,
      },
    })

    const success = result?.success === true

    await supabase.from("webhook_logs").insert({
      source,
      endpoint: "/conversion-webhook",
      payload: rawPayload,
      headers: { source },
      signature_valid: true,
      processed: success,
      tracking_id: trackingId,
      error_message: success ? null : (result?.error || rpcError?.message),
    })

    if (!success) {
      return new Response(
        JSON.stringify({ error: result?.error || rpcError?.message || "Processing failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conversion recorded",
        transaction_id: result.transaction_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("Webhook error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
}

serve(handler)
