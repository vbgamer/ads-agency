import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

interface FraudAlertRequest {
  flag_id: string;
  transaction_id: string;
  severity: string;
  flag_type: string;
  rule_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { flag_id, transaction_id, severity, flag_type, rule_id }: FraudAlertRequest = await req.json();

    console.log(`Processing fraud alert for transaction ${transaction_id}, severity: ${severity}`);

    // Fetch transaction details with campaign and user info
    const { data: transaction, error: txError } = await supabase
      .from("cashback_transactions")
      .select(`
        *,
        campaign:campaigns(id, name, company:companies(id, name)),
        user:profiles(id, name, email)
      `)
      .eq("id", transaction_id)
      .single();

    if (txError || !transaction) {
      console.error("Failed to fetch transaction:", txError);
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch rule details if available
    let ruleName = flag_type;
    if (rule_id) {
      const { data: rule } = await supabase
        .from("fraud_rules")
        .select("name")
        .eq("id", rule_id)
        .single();
      if (rule) {
        ruleName = rule.name;
      }
    }

    // Get all admin users with email notifications enabled
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminUserIds = adminRoles.map(r => r.user_id);

    // Check notification preferences for each admin
    const { data: notificationSettings } = await supabase
      .from("fraud_notification_settings")
      .select("*")
      .in("user_id", adminUserIds);

    // Get admin profiles for email addresses
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", adminUserIds);

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log("No admin profiles found");
      return new Response(
        JSON.stringify({ success: true, message: "No admin profiles to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter admins based on notification preferences
    const adminsToNotify = adminProfiles.filter(admin => {
      const settings = notificationSettings?.find(s => s.user_id === admin.id);
      
      // If no settings exist, default to notifying for critical, not for high
      if (!settings) {
        return severity === "critical";
      }
      
      if (!settings.email_enabled) return false;
      
      if (severity === "critical" && settings.notify_critical_risk) return true;
      if (severity === "high" && settings.notify_high_risk) return true;
      
      return false;
    });

    if (adminsToNotify.length === 0) {
      console.log("No admins opted in for this severity level");
      return new Response(
        JSON.stringify({ success: true, message: "No admins opted in" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format currency
    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(transaction.amount);

    // Prepare email content
    const severityColor = severity === "critical" ? "#dc2626" : "#f59e0b";
    const severityLabel = severity === "critical" ? "CRITICAL" : "HIGH";
    const riskScore = transaction.risk_score || 0;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: ${severityColor}; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Fraud Alert</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
        ${severityLabel} Risk Transaction Detected
      </p>
    </div>

    <!-- Risk Score Badge -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e4e4e7;">
      <span style="background: ${severityColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px;">
        Risk Score: ${riskScore}/100
      </span>
    </div>

    <!-- Transaction Details -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px;">Transaction Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; width: 140px;">Transaction ID</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b; font-family: monospace; font-size: 13px;">${transaction.id.slice(0, 8)}...</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a;">Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b; font-weight: bold;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a;">Campaign</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b;">${transaction.campaign?.name || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a;">Brand</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b;">${transaction.campaign?.company?.name || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a;">User</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b;">${transaction.user?.email || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #71717a;">Created</td>
          <td style="padding: 12px 0; color: #18181b;">${new Date(transaction.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
        </tr>
      </table>
    </div>

    <!-- Triggered Rule -->
    <div style="padding: 0 24px 24px;">
      <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 8px; color: #92400e; font-size: 14px;">⚠️ Triggered Rule</h3>
        <p style="margin: 0; color: #78350f; font-weight: 500;">${ruleName}</p>
      </div>
    </div>

    <!-- Action Button -->
    <div style="padding: 0 24px 24px; text-align: center;">
      <a href="${Deno.env.get("SITE_URL") || "https://id-preview--718f5ef9-26b1-4391-a4f2-638f1f1b7eb4.lovable.app"}/admin" 
         style="display: inline-block; background: #18181b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        Review in Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f4f4f5; padding: 16px 24px; text-align: center;">
      <p style="margin: 0; color: #71717a; font-size: 12px;">
        You're receiving this because you're an admin with fraud alerts enabled.
        <br>Manage your notification preferences in the admin dashboard.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send emails to all opted-in admins
    const emailPromises = adminsToNotify.map(admin => 
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Fraud Alerts <onboarding@resend.dev>",
          to: [admin.email],
          subject: `[${severityLabel}] Fraud Alert - ${amount} - ${transaction.campaign?.name || "Unknown Campaign"}`,
          html: emailHtml,
        }),
      })
    );

    const emailResults = await Promise.allSettled(emailPromises);
    
    const successCount = emailResults.filter(r => r.status === "fulfilled").length;
    const failCount = emailResults.filter(r => r.status === "rejected").length;

    console.log(`Sent ${successCount} emails, ${failCount} failed`);

    // Log the notification
    await supabase.from("webhook_logs").insert({
      source: "fraud-alert",
      event_type: "notification_sent",
      payload: {
        flag_id,
        transaction_id,
        severity,
        admins_notified: successCount,
        admins_failed: failCount,
      },
      status: failCount === 0 ? "success" : "partial",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: successCount,
        emails_failed: failCount 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in fraud-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
