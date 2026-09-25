declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    RESEND_API_KEY?: string;
    MAIL_FROM?: string;
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    GOOGLE_SIGN_IN_ENABLED?: string;
    APPLE_SIGN_IN_ENABLED?: string;
  }
}
