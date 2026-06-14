// Shopify OAuth Callback - Handles the OAuth callback and exchanges code for token
// Deploy to: supabase functions deploy shopify-oauth-callback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY")!;
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET")!;
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://adssimsim.com";
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");

    if (!code || !state || !shop) {
      return Response.redirect(`${frontendUrl}/brand/dashboard?error=missing_params`);
    }

    // Verify state parameter
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "shopify")
      .single();

    if (stateError || !stateData) {
      console.error("Invalid state:", stateError);
      return Response.redirect(`${frontendUrl}/brand/dashboard?error=invalid_state`);
    }

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from("oauth_states").delete().eq("state", state);
      return Response.redirect(`${frontendUrl}/brand/dashboard?error=state_expired`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: shopifyApiKey,
        client_secret: shopifyApiSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return Response.redirect(`${frontendUrl}/brand/dashboard?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    // Get shop details
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });

    let shopName = shop;
    let shopId = null;
    if (shopResponse.ok) {
      const shopData = await shopResponse.json();
      shopName = shopData.shop?.name || shop;
      shopId = shopData.shop?.id?.toString();
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomUUID();

    // Create or update the store integration
    const { data: integration, error: integrationError } = await supabase
      .from("store_integrations")
      .upsert({
        company_id: stateData.company_id,
        platform: "shopify",
        status: "connected",
        access_token: accessToken,
        store_url: shop,
        store_name: shopName,
        store_id: shopId,
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
      return Response.redirect(`${frontendUrl}/brand/dashboard?error=save_failed`);
    }

    // Register webhooks for order events
    const webhookUrl = `${supabaseUrl}/functions/v1/shopify-webhook/${integration.id}`;
    
    const webhookTopics = [
      "orders/create",
      "orders/paid", 
      "orders/fulfilled",
    ];

    for (const topic of webhookTopics) {
      try {
        await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook: {
              topic: topic,
              address: webhookUrl,
              format: "json",
            },
          }),
        });
      } catch (webhookError) {
        console.error("Failed to register webhook", topic, webhookError);
      }
    }

    // Clean up state
    await supabase.from("oauth_states").delete().eq("state", state);

    // Redirect to dashboard with success
    return Response.redirect(`${frontendUrl}/brand/dashboard?tab=integrations&success=shopify_connected`);

  } catch (error) {
    console.error("Error:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://adssimsim.com";
    return Response.redirect(`${frontendUrl}/brand/dashboard?error=unknown`);
  }
});
