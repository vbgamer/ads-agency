// Shopify Webhook Handler - Receives order events from Shopify
// Deploy to: supabase functions deploy shopify-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get integration ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const integrationId = pathParts[pathParts.length - 1];

    if (!integrationId || integrationId === "shopify-webhook") {
      return new Response(JSON.stringify({ error: "Integration ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get raw body for HMAC verification
    const rawBody = await req.text();
    
    // Verify Shopify HMAC signature
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    if (hmacHeader && shopifyApiSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(shopifyApiSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));
      
      if (computedHmac !== hmacHeader) {
        console.error("HMAC verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const topic = req.headers.get("x-shopify-topic");
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    console.log(`Received Shopify webhook: ${topic} from ${shopDomain}`);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("store_integrations")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (integrationError || !integration) {
      console.error("Integration not found:", integrationError);
      return new Response(JSON.stringify({ error: "Integration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Shopify topic to our event type
    const eventTypeMap: Record<string, string> = {
      "orders/create": "order_placed",
      "orders/paid": "order_paid",
      "orders/fulfilled": "order_fulfilled",
    };

    const eventType = eventTypeMap[topic || ""] || "custom";

    // Check if this event type is tracked
    if (!integration.tracked_events.includes(eventType)) {
      return new Response(JSON.stringify({ message: "Event type not tracked" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract order details
    const orderId = payload.id?.toString() || payload.order_number?.toString();
    const orderTotal = parseFloat(payload.total_price) || 0;
    const currency = payload.currency || "INR";
    const customerEmail = payload.email || payload.customer?.email;

    // Try to find tracking_id in order notes, note_attributes, or discount codes
    let trackingId = null;
    
    // Check note_attributes
    if (payload.note_attributes) {
      const trackingAttr = payload.note_attributes.find(
        (attr: any) => attr.name?.toLowerCase() === "tracking_id" || attr.name?.toLowerCase() === "ref"
      );
      if (trackingAttr) {
        trackingId = trackingAttr.value;
      }
    }

    // Check order note
    if (!trackingId && payload.note) {
      const match = payload.note.match(/tracking_id[:\s]*([a-zA-Z0-9_-]+)/i);
      if (match) {
        trackingId = match[1];
      }
    }

    // Check discount codes (some implementations pass tracking_id as discount code)
    if (!trackingId && payload.discount_codes) {
      for (const discount of payload.discount_codes) {
        if (discount.code?.startsWith("trk_")) {
          trackingId = discount.code;
          break;
        }
      }
    }

    // Check landing_site URL for ref parameter
    if (!trackingId && payload.landing_site) {
      try {
        const landingUrl = new URL(payload.landing_site, "https://example.com");
        trackingId = landingUrl.searchParams.get("ref");
      } catch (e) {
        // Invalid URL, ignore
      }
    }

    // Process the order event
    const { data: eventId, error: processError } = await supabase.rpc(
      "process_integration_order",
      {
        p_integration_id: integrationId,
        p_external_order_id: orderId,
        p_order_total: orderTotal,
        p_customer_email: customerEmail,
        p_tracking_id: trackingId,
        p_event_type: eventType,
        p_raw_payload: payload,
      }
    );

    if (processError) {
      console.error("Process error:", processError);
      // Still return 200 to prevent Shopify from retrying
      return new Response(JSON.stringify({ 
        received: true, 
        processed: false,
        error: processError.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last sync time
    await supabase
      .from("store_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integrationId);

    return new Response(JSON.stringify({ 
      received: true, 
      processed: true,
      event_id: eventId,
      tracking_id: trackingId 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Return 200 to prevent retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
