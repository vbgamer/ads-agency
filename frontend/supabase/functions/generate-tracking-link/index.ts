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
  campaign_id: string;
}

interface TrackingLinkResponse {
  tracking_id: string;
  tracking_url: string;
  destination_url: string;
  campaign_title: string;
  coupon_code: string | null;
  webhook_callback_url: string;
  message: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Get auth token from request
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Validate user
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
  
  if (claimsError || !claimsData.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.user.id;

  try {
    const body: RequestBody = await req.json();
    
    if (!body.campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get campaign details with destination_url (now required)
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, company_id, title, status, code, destination_url")
      .eq("id", body.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (campaign.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Campaign is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!campaign.destination_url) {
      return new Response(
        JSON.stringify({ error: "Campaign destination URL not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-generated webhook callback URL for this campaign
    const webhookCallbackUrl = `${supabaseUrl}/functions/v1/conversion-webhook?campaign_id=${campaign.id}`;

    // Check if user already has an active tracking click for this campaign
    const { data: existingClick } = await supabase
      .from("tracking_clicks")
      .select("id, tracking_id, status")
      .eq("user_id", userId)
      .eq("campaign_id", body.campaign_id)
      .in("status", ["clicked", "converted"])
      .maybeSingle();

    if (existingClick) {
      if (existingClick.status === "converted") {
        return new Response(
          JSON.stringify({ error: "You have already converted on this campaign" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Build tracking URL for existing click
      const trackingUrl = `${supabaseUrl}/functions/v1/track-redirect/${existingClick.tracking_id}`;
      
      // Return existing tracking link if still valid
      return new Response(
        JSON.stringify({
          tracking_id: existingClick.tracking_id,
          tracking_url: trackingUrl,
          destination_url: campaign.destination_url,
          campaign_title: campaign.title,
          coupon_code: campaign.code,
          webhook_callback_url: webhookCallbackUrl,
          message: "Existing tracking link returned",
        } as TrackingLinkResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique tracking ID
    const { data: trackingId, error: genError } = await supabase.rpc("generate_tracking_id");
    
    if (genError) {
      console.error("Error generating tracking ID:", genError);
      return new Response(
        JSON.stringify({ error: "Failed to generate tracking link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create tracking click record
    const { data: click, error: insertError } = await supabase
      .from("tracking_clicks")
      .insert({
        tracking_id: trackingId,
        user_id: userId,
        campaign_id: body.campaign_id,
        company_id: campaign.company_id,
        status: "clicked",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating tracking click:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create tracking link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Track click event in analytics
    await supabase.from("campaign_analytics").insert({
      campaign_id: body.campaign_id,
      user_id: userId,
      event_type: "click",
    });

    // Build tracking URL
    const trackingUrl = `${supabaseUrl}/functions/v1/track-redirect/${trackingId}`;

    return new Response(
      JSON.stringify({
        tracking_id: trackingId,
        tracking_url: trackingUrl,
        destination_url: campaign.destination_url,
        campaign_title: campaign.title,
        coupon_code: campaign.code,
        webhook_callback_url: webhookCallbackUrl,
        message: "Tracking link created successfully",
      } as TrackingLinkResponse),
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
