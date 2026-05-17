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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Use service role key to update click records
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse tracking_id from URL path or query params
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const trackingId = pathParts[pathParts.length - 1] || url.searchParams.get('id');

    if (!trackingId || !trackingId.startsWith('trk_')) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tracking click with campaign data
    const { data: click, error: clickError } = await supabase
      .from('tracking_clicks')
      .select(`
        id,
        tracking_id,
        status,
        expires_at,
        user_id,
        campaign_id,
        company_id,
        click_url
      `)
      .eq('tracking_id', trackingId)
      .single();

    if (clickError || !click) {
      console.error('Tracking click not found:', clickError);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Invalid Link</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1 style="color: #ef4444;">Invalid Tracking Link</h1>
            <p>This tracking link is not valid or has been removed.</p>
            <a href="/" style="color: #10b981;">Return to Home</a>
          </div>
        </body>
        </html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    // Check if expired
    if (click.status === 'expired' || new Date(click.expires_at) < new Date()) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Link Expired</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1 style="color: #f59e0b;">Link Expired</h1>
            <p>This tracking link has expired. Please grab a new deal.</p>
            <a href="/" style="color: #10b981;">Browse Deals</a>
          </div>
        </body>
        </html>`,
        { status: 410, headers: { "Content-Type": "text/html" } }
      );
    }

    // Fetch campaign with destination URL (now required)
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('destination_url, title')
      .eq('id', click.campaign_id)
      .single();

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
    }

    // destination_url is now required - no fallback
    const destinationUrl = campaign?.destination_url;

    if (!destinationUrl) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>No Destination</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1 style="color: #f59e0b;">Campaign Not Configured</h1>
            <p>The destination URL has not been configured for this campaign.</p>
            <p style="font-size: 0.875rem; color: #6b7280;">Please contact the brand to resolve this issue.</p>
            <a href="/" style="color: #10b981;">Browse Deals</a>
          </div>
        </body>
        </html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Build destination URL with tracking parameters
    const destUrl = new URL(destinationUrl);
    destUrl.searchParams.set('ref', trackingId);
    destUrl.searchParams.set('utm_source', 'cashback_app');
    destUrl.searchParams.set('utm_medium', 'referral');
    destUrl.searchParams.set('utm_campaign', click.campaign_id);

    // Update tracking click with redirect timestamp
    const { error: updateError } = await supabase
      .from('tracking_clicks')
      .update({ 
        click_url: destUrl.toString(),
      })
      .eq('id', click.id);

    if (updateError) {
      console.error('Error updating tracking click:', updateError);
    }

    // Log the redirect for analytics
    console.log(`Redirecting tracking ${trackingId} to ${destUrl.toString()}`);

    // Return 302 redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": destUrl.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h1 style="color: #ef4444;">Something went wrong</h1>
          <p>Please try again later.</p>
          <a href="/" style="color: #10b981;">Return to Home</a>
        </div>
      </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
});
