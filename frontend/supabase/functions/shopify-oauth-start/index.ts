// Shopify OAuth Start - Initiates the OAuth flow
// Deploy to: supabase functions deploy shopify-oauth-start

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
    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY")!;
    
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
    const { shop_url } = await req.json();
    
    if (!shop_url) {
      return new Response(JSON.stringify({ error: "shop_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize shop URL (e.g., "mystore" -> "mystore.myshopify.com")
    let shopDomain = shop_url.trim().toLowerCase();
    if (!shopDomain.includes(".myshopify.com")) {
      shopDomain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!shopDomain.includes(".")) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in database for verification
    const { error: stateError } = await supabase
      .from("oauth_states")
      .insert({
        state,
        company_id: user.id,
        platform: "shopify",
        shop_domain: shopDomain,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

    if (stateError) {
      console.error("State storage error:", stateError);
      return new Response(JSON.stringify({ error: "Failed to initiate OAuth" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Shopify OAuth scopes needed for order tracking
    const scopes = [
      "read_orders",
      "read_products", 
      "read_customers",
    ].join(",");

    // Build OAuth authorization URL
    const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth-callback`;
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` + new URLSearchParams({
      client_id: shopifyApiKey,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
    }).toString();

    return new Response(JSON.stringify({ 
      auth_url: authUrl,
      shop_domain: shopDomain 
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
