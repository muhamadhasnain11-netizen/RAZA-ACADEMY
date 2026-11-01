import { createClient } from "@supabase/supabase-js";

// Both values are public by design (the publishable key is safe in the browser).
// Data is protected by the row-level security rules in the supabase folder.
export const SUPABASE_URL = "https://phkmbewpqakpsaaprqsb.supabase.co";
export const SUPABASE_KEY = "sb_publishable_COzuF4VimUJo76Zf3WNF9Q_0hUd37-p";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
