// WooCommerce Webhook Handler - Receives order events from WooCommerce
// Deploy to: supabase functions deploy woocommerce-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-topic, x-wc-webhook-source",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get integration ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const integrationId = pathParts[pathParts.length - 1];

    if (!integrationId || integrationId === "woocommerce-webhook") {
      return new Response(JSON.stringify({ error: "Integration ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get raw body
    const rawBody = await req.text();

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

    // Verify WooCommerce webhook signature
    const signature = req.headers.get("x-wc-webhook-signature");
    if (signature && integration.webhook_secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(integration.webhook_secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const computedSignature = btoa(String.fromCharCode(...new Uint8Array(sig)));
      
      if (computedSignature !== signature) {
        console.error("Signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const topic = req.headers.get("x-wc-webhook-topic");
    const source = req.headers.get("x-wc-webhook-source");

    console.log(`Received WooCommerce webhook: ${topic} from ${source}`);

    // Map WooCommerce status/topic to our event type
    let eventType = "custom";
    const orderStatus = payload.status?.toLowerCase();
    
    if (topic === "order.created" || orderStatus === "pending") {
      eventType = "order_placed";
    } else if (orderStatus === "processing" || orderStatus === "completed" || orderStatus === "on-hold") {
      eventType = "order_paid";
    } else if (orderStatus === "completed") {
      eventType = "order_fulfilled";
    }

    // Check if payment was made
    if (payload.date_paid && eventType === "order_placed") {
      eventType = "order_paid";
    }

    // Check if this event type is tracked
    if (!integration.tracked_events.includes(eventType)) {
      return new Response(JSON.stringify({ message: "Event type not tracked" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract order details
    const orderId = payload.id?.toString() || payload.order_key;
    const orderTotal = parseFloat(payload.total) || 0;
    const currency = payload.currency || "INR";
    const customerEmail = payload.billing?.email;

    // Try to find tracking_id
    let trackingId = null;

    // Check meta_data
    if (payload.meta_data) {
      const trackingMeta = payload.meta_data.find(
        (meta: any) => meta.key === "tracking_id" || meta.key === "_tracking_id" || meta.key === "ref"
      );
      if (trackingMeta) {
        trackingId = trackingMeta.value;
      }
    }

    // Check customer note
    if (!trackingId && payload.customer_note) {
      const match = payload.customer_note.match(/tracking_id[:\s]*([a-zA-Z0-9_-]+)/i);
      if (match) {
        trackingId = match[1];
      }
    }

    // Check coupon codes
    if (!trackingId && payload.coupon_lines) {
      for (const coupon of payload.coupon_lines) {
        if (coupon.code?.startsWith("trk_")) {
          trackingId = coupon.code;
          break;
        }
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
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
