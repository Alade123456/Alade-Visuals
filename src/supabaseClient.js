import { createClient } from "@supabase/supabase-js";

// Replace these variables with your actual Supabase project URL and public anon key
const SUPABASE_URL = "https://tbglknkoqjfobijrsrvd.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_sJWu1Fz0WfuF4bwfIUUcyg_lOfpMO04";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
