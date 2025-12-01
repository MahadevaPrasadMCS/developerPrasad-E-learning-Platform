import { createClient } from "@supabase/supabase-js";

// First priority: window.env (for production runtime config)
const supabaseUrl = window?.env?.VITE_SUPABASE_URL || process.env?.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = window?.env?.VITE_SUPABASE_ANON_KEY || process.env?.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase env variables!");
  console.log("supabaseUrl:", supabaseUrl);
  console.log("supabaseAnonKey:", supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
