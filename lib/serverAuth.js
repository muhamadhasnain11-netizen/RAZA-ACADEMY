import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";

// Server-side helpers. DAILY_API_KEY is a secret set in Vercel and never sent to the browser.
export function userClient(req) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  return { token, db: createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } }) };
}
export const daily = (path, opts = {}) =>
  fetch("https://api.daily.co/v1" + path, {
    ...opts, cache: "no-store",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
  });
export const NOT_SETUP = { error: "The video classroom is not set up yet. Ask the academy owner." };
