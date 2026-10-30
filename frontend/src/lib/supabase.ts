import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yobuntpfrezdwzltaalo.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const supabase = createClient(supabaseUrl, supabaseKey);