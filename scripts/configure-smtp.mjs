#!/usr/bin/env node
/**
 * Configure Supabase custom SMTP for the Clear Vision Boards project.
 *
 * Uploads the SMTP credentials to Supabase Auth so magic-link / OTP /
 * email-confirmation emails go through your SMTP provider instead of
 * Supabase's free-tier mailer (which is rate-limited at 2 emails/hour).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx \
 *   SMTP_HOST=smtp.resend.com \
 *   SMTP_PORT=587 \
 *   SMTP_USER=resend \
 *   SMTP_PASS=re_xxx \
 *   SMTP_ADMIN_EMAIL=hello@clearvisioneducation.app \
 *   SMTP_SENDER_NAME="Clear Vision Boards" \
 *   node scripts/configure-smtp.mjs
 *
 * Recommended provider: Resend (https://resend.com)
 *   - Free tier: 100 emails/day, 3000/month
 *   - 1-minute signup, no credit card
 *   - For production: verify a domain (clearvisioneducation.app) so
 *     the from-address shows up correctly.
 *
 * Other supported providers (drop-in): Postmark, SendGrid, Mailgun,
 * AWS SES, Brevo (Sendinblue). Just swap SMTP_HOST/PORT/USER/PASS.
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "hypnejdbvlrbszpydtyh";

const required = ["SUPABASE_ACCESS_TOKEN", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_ADMIN_EMAIL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error("\nSee the file header for usage. Quickest path:");
  console.error("  1) Sign up at https://resend.com (free)");
  console.error("  2) Verify clearvisioneducation.app domain (or use the test-only resend.dev sender)");
  console.error("  3) Create an API key, then re-run this script with the env vars set.");
  process.exit(1);
}

const body = {
  external_email_enabled: true,
  smtp_host: process.env.SMTP_HOST,
  // Supabase Management API quirk — expects port as a string, not a number.
  smtp_port: String(process.env.SMTP_PORT),
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  smtp_admin_email: process.env.SMTP_ADMIN_EMAIL,
  smtp_sender_name: process.env.SMTP_SENDER_NAME || "Clear Vision Boards",
  // Bumped from the default 2/hr → 100/hr now that we're not on the
  // shared Supabase mailer. Per-OTP limit lives separately and is
  // already set high enough.
  rate_limit_email_sent: 100,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
const data = await res.json();
if (!res.ok) {
  console.error("Supabase rejected the SMTP config:");
  console.error(JSON.stringify(data, null, 2));
  process.exit(2);
}
console.log("✓ SMTP configured. Verify with:");
console.log(`  curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth | jq '.smtp_host, .smtp_admin_email, .rate_limit_email_sent'`);
