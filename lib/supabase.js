import { createClient } from "@supabase/supabase-js";

// Both values are public by design (the publishable key is safe in the browser).
// Data is protected by the row-level security rules in supabase/schema.sql.
export const supabase = createClient(
  "https://phkmbewpqakpsaaprqsb.supabase.co",
  "sb_publishable_COzuF4VimUJo76Zf3WNF9Q_0hUd37-p"
);
