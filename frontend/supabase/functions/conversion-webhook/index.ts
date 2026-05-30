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

// Extract best-guess client IP for rate limiting
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown"
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
    const headerSource = req.headers.get("x-webhook-source")
    const signature = req.headers.get("x-webhook-signature") || ""
    const campaignIdFromUrl = url.searchParams.get("campaign_id")
    const clientIp = getClientIp(req)

    // ============================================================
    //  RATE LIMIT — per IP, 30 requests / 60s window
    // ============================================================
    const { data: ipAllowed } = await supabase.rpc("check_rate_limit", {
      p_bucket_key:  `ip:${clientIp}`,
      p_endpoint:    "/conversion-webhook",
      p_max_events:  30,
      p_window_secs: 60,
    })
    if (ipAllowed === false) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const rawBody = await req.text()

    // Parse body FIRST so we can fall back to body.source
    // (navigator.sendBeacon cannot set custom headers, so JS pixels
    // identify themselves via a "source" field in the body)
    let rawPayload: Record<string, unknown>
    try {
      rawPayload = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Resolve source: header takes priority, body.source is the fallback
    const source = (headerSource || (rawPayload.source as string) || "unknown").toLowerCase()

    // Sources allowed without HMAC signature.
    // - "pixel" / "auto-pixel": runs in the browser, cannot keep a secret
    // - "manual": admin-initiated test
    // These rely on tracking_id existence + RPC-level dedup & fraud checks.
    const PUBLIC_SOURCES = new Set(["pixel", "auto-pixel", "manual"])

    // Verify webhook signature for known affiliate sources
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
    } else if (!PUBLIC_SOURCES.has(source)) {
      // Reject requests with no identified or whitelisted source
      await supabase.from("webhook_logs").insert({
        source,
        endpoint: "/conversion-webhook",
        payload: rawPayload,
        headers: { source },
        signature_valid: false,
        processed: false,
        error_message: `Unknown source "${source}" - must be a registered affiliate source or one of: ${Array.from(PUBLIC_SOURCES).join(", ")}`,
      })
      return new Response(
        JSON.stringify({ error: "Unknown or missing webhook source" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const campaignId = campaignIdFromUrl || (rawPayload.campaign_id as string)
    const trackingId = (rawPayload.tracking_id || rawPayload.ref || rawPayload.click_id) as string
    const eventType = (rawPayload.event_type as string) || "purchase"
    const expectedCompanyId = (rawPayload.company_id as string) || null

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

    // ============================================================
    //  RATE LIMIT — per tracking_id, 5 attempts / 60s
    //  Prevents replay/brute-force against a single tracking link
    // ============================================================
    const { data: trkAllowed } = await supabase.rpc("check_rate_limit", {
      p_bucket_key:  `trk:${trackingId}`,
      p_endpoint:    "/conversion-webhook",
      p_max_events:  5,
      p_window_secs: 60,
    })
    if (trkAllowed === false) {
      return new Response(
        JSON.stringify({ error: "Too many attempts for this tracking ID" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Process the conversion
    const { data: result, error: rpcError } = await supabase.rpc("process_conversion", {
      p_tracking_id: trackingId,
      p_conversion_type: eventType,
      p_conversion_data: {
        source,
        // Support both affiliate-style (event_value) and pixel-style (order_total) payloads
        event_value: rawPayload.event_value ?? rawPayload.order_total,
        event_currency: rawPayload.event_currency || rawPayload.currency || "INR",
        order_id: rawPayload.order_id,
        customer_email: rawPayload.customer_email,
        client_ip: clientIp,
        timestamp: new Date().toISOString(),
        campaign_id: campaignId,
      },
      p_expected_company_id: expectedCompanyId,
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
