// WooCommerce Connect - Handles WooCommerce REST API connection
// Deploy to: supabase functions deploy woocommerce-connect

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const { store_url, consumer_key, consumer_secret } = await req.json();
    
    if (!store_url || !consumer_key || !consumer_secret) {
      return new Response(JSON.stringify({ 
        error: "store_url, consumer_key, and consumer_secret are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize store URL
    let storeUrl = store_url.trim();
    if (!storeUrl.startsWith("http")) {
      storeUrl = `https://${storeUrl}`;
    }
    storeUrl = storeUrl.replace(/\/$/, "");

    // Test the WooCommerce connection
    const testUrl = `${storeUrl}/wp-json/wc/v3/system_status`;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);
    
    const testResponse = await fetch(testUrl, {
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error("WooCommerce connection test failed:", errorText);
      return new Response(JSON.stringify({ 
        error: "Failed to connect to WooCommerce. Please check your credentials.",
        details: testResponse.status === 401 ? "Invalid API credentials" : "Store not reachable"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemStatus = await testResponse.json();
    const storeName = systemStatus.environment?.site_title || storeUrl;

    // Generate webhook secret
    const webhookSecret = crypto.randomUUID();

    // Create or update the store integration
    const { data: integration, error: integrationError } = await supabase
      .from("store_integrations")
      .upsert({
        company_id: user.id,
        platform: "woocommerce",
        status: "connected",
        access_token: consumer_key, // Store consumer_key as access_token
        refresh_token: consumer_secret, // Store consumer_secret as refresh_token
        store_url: storeUrl,
        store_name: storeName,
        webhook_secret: webhookSecret,
        tracked_events: ["order_paid"],
        auto_verify_conversions: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "company_id,platform",
      })
      .select()
      .single();

    if (integrationError) {
      console.error("Integration save error:", integrationError);
      return new Response(JSON.stringify({ error: "Failed to save integration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Register WooCommerce webhooks
    const webhookUrl = `${supabaseUrl}/functions/v1/woocommerce-webhook/${integration.id}`;
    
    const webhookTopics = [
      { name: "Order created", topic: "order.created", delivery_url: webhookUrl },
      { name: "Order updated", topic: "order.updated", delivery_url: webhookUrl },
    ];

    for (const webhook of webhookTopics) {
      try {
        await fetch(`${storeUrl}/wp-json/wc/v3/webhooks`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `ADSSIMSIM - ${webhook.name}`,
            topic: webhook.topic,
            delivery_url: webhook.delivery_url,
            secret: webhookSecret,
            status: "active",
          }),
        });
      } catch (webhookError) {
        console.error(`Failed to register webhook ${webhook.topic}:`, webhookError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      integration: {
        id: integration.id,
        store_name: storeName,
        store_url: storeUrl,
        status: integration.status,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
